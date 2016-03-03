# -*- coding: utf-8 -*-

import datetime
import json
from django.db.models import Q
from django.core.mail import send_mail
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
        r = send_order_to_users_google_calendar.apply(
            args=[order.id], kwargs={'send_email': False})
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
                srv_info_str += ' {1} {0},'.format(
                    item.additional_service.price,
                    item.additional_service.title)
                srv_list.append(item.additional_service.id)

        srv_info_str = ', %s' % srv_info_str
        srv_info_str = srv_info_str.rstrip(',')

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

    summary = '({title} {duration} мин.) '
    summary = summary.format(title='{title}', duration=order.duration)

    if data.get('cl_name'):
        summary += 'Клиент: {cl_name} {cl_phone}, '.format(
            cl_name=data.get('cl_name'), cl_phone=data.get('cl_phone'))

    summary += 'Ребенок: {ch_info}, {ch_num} детей. {place}, {address}'.format(
        ch_info=data.get('ch_info'),
        ch_num=data.get('ch_num'),
        place=data.get('place'),
        address=data.get('address'))

    summary += ', %s' % data.get('details') if data.get('details') else ''
    summary += '. Стоимость: программа %s' % data.get('program_price')
    summary += data.get('additional_srv_info')
    summary += '. Итого за заказ: {0}.'.format(data.get('total_price'))

    regex = re.compile('\s+')
    summary = regex.sub(' ', summary)

    return summary


@app.task
def send_order_to_users_google_calendar(
        order_id, send_email=True, is_full_description=None,
        is_new_order=False):
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
                executor, order.hex_id(), event_start, event_end, summary,
                description)
            if send_email is True:
                send_order_notice_to_email(order, executor,
                                           'create' if is_new_order else 'update')
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

    if target_users is None:
        target_users = set([i.user_id for i in order.program_executors.all()])
        target_users.update(
            [i.executor.user_id for i in
             order.additional_services_executors.all()]
        )

    results = {}

    try:
        for user_id in target_users:
            user = User.objects.get(id=user_id)
            res = google_api_handler.delete_event_from_user_calendar(
                user, order.hex_id())
            results.update({user.get_full_name(): res})
            send_order_notice_to_email(order, user, action_type='delete')
    except Exception as ex:
        logger.error(ex.args[0])
        return ex.args[0]

    return results


def send_order_notice_to_email(order, user, action_type):
    from django.conf import settings

    user = user if not hasattr(user, 'user') else user.user

    if action_type == 'update':
        subject = 'Изменен заказ'
    elif action_type == 'create':
        subject = 'Создан заказ'
    elif action_type == 'delete':
        subject = 'Удален/Отменен заказ'
    else:
        raise AttributeError('Invalid \'%s\' action_type!' % action_type)

    date_str = '{0} {1}'.format(order.celebrate_date, order.celebrate_time)
    celebrate_date = datetime.datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')

    body = '{subject} ({order_name}) на {date} в {time}. Подробнее см. в ' \
           'своем аккаунте http://zakaz.tilibom.by/ или Google-календаре.' \
        .format(subject=subject, order_name=order.program.title,
                date=celebrate_date.strftime('%d/%m/%Y'),
                time=celebrate_date.strftime('%H-%M'))

    from_email = settings.EMAIL_HOST_USER
    recipient_list = [user.email]

    subject += ' №%s' % order.code

    send_mail(subject, body, from_email, recipient_list)


@app.task
def set_debtors():
    import datetime
    from orders_manager.models import Order

    today_min = datetime.datetime.combine(
        datetime.date.today(), datetime.time.min)
    today_max = datetime.datetime.combine(
        datetime.date.today(), datetime.time.max)
    today_now = datetime.datetime.now()

    today_orders = Order.objects.filter(
        celebrate_date__range=(today_min, today_max)).all()

    for order in today_orders:
        d_str = '{0} {1}'.format(order.celebrate_date, order.celebrate_time)
        celebrate_date = datetime.datetime.strptime(d_str, '%Y-%m-%d %H:%M:%S')
        if celebrate_date < today_now and not len(order.animator_debts.all()):
            create_debt_for_order(order)


def create_debt_for_order(order):
    from orders_manager.models import AnimatorDebt
    AnimatorDebt(
        order=order,
        executor=order.program_executors.first(),
        debt=order.total_price_with_discounts - order.cost_of_the_way
    ).save()


@app.task
def run_generating_sms_messages():
    from orders_manager.models import SmsDeliveryEvent, SmsDeliveryMessage
    sms = []
    for event in SmsDeliveryEvent.objects.all():
        for order in _get_target_orders(event):
            sms_msg = SmsDeliveryMessage(event=event, order=order)
            sms.append(sms_msg)
            sms_msg.save()
    return sms


def _get_target_orders(delivery_event):
    from orders_manager.models import Order
    today = datetime.date.today()
    if delivery_event.type == 'after':
        target_date = today - datetime.timedelta(days=delivery_event.days_num)
    else:
        target_date = today + datetime.timedelta(days=delivery_event.days_num)
    d_min = datetime.datetime.combine(target_date, datetime.time.min)
    d_max = datetime.datetime.combine(target_date, datetime.time.max)
    return Order.objects.filter(celebrate_date__range=(d_min, d_max)).all()


# @app.task
def send_sms_messages_bulk(msg_data, replace_names=False):
    from orders_manager.models import Client, SmsDeliveryMessage
    from orders_manager.sms_delivery_service import SmsDeliveryService
    clients = Client.objects.filter(
        pk__in=[i.get('client_id') for i in msg_data]).all()
    messages = []
    for client in clients:
        for item in msg_data:
            if item.get('client_id') == client.id:
                msg = (item.get('message').format(client_name=client.name)
                       if replace_names else item.get('message'))
                messages.append({
                    'recipient': client.phone,
                    'message': msg
                })

    sms_service = SmsDeliveryService()
    sms_service.send_messages(messages)
    sms_ids = [i.get('id') for i in msg_data if i.get('id')]
    if sms_ids:
        for sms_model in SmsDeliveryMessage.objects.filter(pk__in=sms_ids):
            sms_model.is_checked = True
            sms_model.is_sent = True
            sms_model.save()
    return sms_ids
