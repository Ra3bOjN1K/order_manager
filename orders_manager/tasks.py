# -*- coding: utf-8 -*-

import datetime
import json
from django.db.models import Q
from app.celery import app
from celery.utils.log import get_task_logger


@app.task
def cyclically_update_orders_to_google_calendars():
    import datetime
    from orders_manager.models import Order

    dt_now = datetime.datetime.now().replace(hour=0, minute=0, second=0,
                                             microsecond=0)
    min_lim = dt_now - datetime.timedelta(1)
    max_lim = dt_now + datetime.timedelta(2)

    orders = Order.objects.filter(
        Q(celebrate_date__gte=min_lim) & Q(celebrate_date__lte=max_lim)).all()

    result_msg = []

    for order in orders:
        r = send_order_to_users_google_calendar.apply(args=[order.id])
        result_msg.append(r.get())

    return '| '.join(result_msg)


def _get_order_description(order, full_desc=False):
    desc = 'Название программы: %s.\n' % (order.program.title or '-')
    if full_desc:
        desc += 'Заказчик: %s (тел. %s)\n' % (
            order.client.name, order.client.phone)
        desc += 'Ребенок(дети): %s\n' % ', '.join(
            ['%s (%s)' % (ch.name, ch.verbose_age()) for ch in
             order.client_children.all()]
        )
        desc += 'Место проведения: %s\n' % order.celebrate_place

        a = json.loads(order.address)

        desc += 'Адрес: %s, ул.%s, д.%s, кв.%s, доп.инф.: %s\n' % (
            a.get('city', '-'), a.get('street', '-'), a.get('house', '-'),
            a.get('apartment', '-'), a.get('details', '-')
        )
        desc += 'Цена: %s\n' % order.total_price_with_discounts
    return desc


def _get_order_summary(order, full_desc=False):
    import re

    addr = json.loads(order.address)

    srv_list = []
    srv_info_str = ''

    if len(order.additional_services_executors.all()) > 0:
        for item in order.additional_services_executors.all():
            if item.additional_service.id not in srv_list:
                srv_info_str += ' {0} {1}'.format(
                    item.additional_service.price,
                    item.additional_service.title)
                srv_list.append(item.additional_service.id)

        srv_info_str = '. Стоимость доп.услуг:%s' % srv_info_str

    data = {
        'cl_name': order.client.name,
        'cl_phone': order.client.phone,
        'ch_info': (', '.join(
            ['{0}({1})'.format(ch.name, ch.verbose_age())
             for ch in order.client_children.all()])),
        'ch_num': order.children_num,
        'place': order.celebrate_place,
        'address': 'г.{0} ул.{1} {2} {3}'.format(
            addr.get('city'), addr.get('street'),
            (
                'д.{0} кв.{1}'.format(addr.get('house'), addr.get('apartment'))
                if addr.get('apartment') else 'д.{0}'.format(addr.get('house'))
            ),
            addr.get('details', '')),
        'details': order.details,
        'program_price': order.price,
        'additional_srv_info': srv_info_str,
        'total_price': order.total_price_with_discounts
    }

    if not full_desc:
        data.update({
            'cl_name': '',
            'cl_phone': '',
            'address': 'г.{0} ул.{1} д.{2}'.format(
                addr.get('city'), addr.get('street'), addr.get('house'))
        })

    summary = '({title}) '

    if data.get('cl_name'):
        summary += 'Клиент: {cl_name} {cl_phone}, '.format(
            cl_name=data.get('cl_name'), cl_phone=data.get('cl_phone'))

    summary += 'Ребенок: {ch_info}, {ch_num} детей. {place}, {address}'.format(
        ch_info=data.get('ch_info'),
        ch_num=data.get('ch_num'),
        place=data.get('place'),
        address=data.get('address'))

    summary += ', %s' % data.get('details') if data.get('details') else ''
    summary += '. Стоимость программы: %s' % data.get('program_price')
    summary += data.get('additional_srv_info')
    summary += '. Итого за заказ: {0}.'.format(data.get('total_price'))

    regex = re.compile('\s+')
    summary = regex.sub(' ', summary)

    return summary


@app.task
def send_order_to_users_google_calendar(order_id, is_full_description=None):
    from orders_manager.models import Order, UserProfile
    from orders_manager.google_apis import GoogleApiHandler

    logger = get_task_logger(__name__)

    google_api_handler = GoogleApiHandler()
    order = Order.objects.get(id=order_id)

    if is_full_description is None:
        dt = datetime.datetime.strptime(
            '%s %s' % (order.celebrate_date, '00:00:00'), '%Y-%m-%d %H:%M:%S')
        today = datetime.datetime.now().replace(hour=0, minute=0, second=0,
                                                microsecond=0)
        dt_lim = today + datetime.timedelta(2)
        is_full_description = 0 < (dt_lim - dt).days <= 2

    date_str = '{0} {1}'.format(order.celebrate_date, order.celebrate_time)
    event_start = datetime.datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
    event_duration = int(order.duration)
    event_end = event_start + datetime.timedelta(0, event_duration * 60)
    event_start = event_start.isoformat()
    event_end = event_end.isoformat()

    logger.debug('Sending order \'%s\' start \'%s\'' % (order.program.title,
                                                        event_start))

    executor_to_event_title = {}

    description = _get_order_description(order, is_full_description)

    for program_executor in order.program_executors.all():
        executor_to_event_title[program_executor.user_id] = order.program.title

    for service_to_executors in order.additional_services_executors.all():
        if executor_to_event_title.get(service_to_executors.executor.user_id):
            executor_to_event_title[service_to_executors.executor.user_id] += \
                ' + %s' % service_to_executors.additional_service.title

        else:
            executor_to_event_title[service_to_executors.executor.user_id] = \
                service_to_executors.additional_service.title

    for user_id, title in executor_to_event_title.items():
        executor = UserProfile.objects.get(user_id=user_id)
        try:
            summary = _get_order_summary(order, is_full_description)
            summary = summary.format(title=title)
            google_api_handler.send_event_to_user_calendar(
                executor, order.hex_id(), event_start, event_end,
                summary, description)
        except Exception as ex:
            logger.error(ex.args[0])

    return '{0} was updated.'.format(order.program.title)


@app.task
def delete_order_from_users_google_calendar(order_id, target_users=None):
    from orders_manager.models import User, Order
    from orders_manager.google_apis import GoogleApiHandler

    logger = get_task_logger(__name__)

    google_api_handler = GoogleApiHandler()

    order = Order.objects.get(id=order_id)

    try:
        for user_id in target_users:
            user = User.objects.get(id=user_id)
            google_api_handler.delete_event_from_user_calendar(user,
                                                               order.hex_id())
    except Exception as ex:
        logger.error(ex.args[0])
        return ex.args[0]

    return 'Success'
