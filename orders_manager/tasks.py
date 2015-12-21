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
        r = send_order_to_users.apply(args=[order.id])
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
            a['city'], a['street'], a['house'], a['apartment'], a['details']
        )
        desc += 'Цена: %s\n' % order.total_price_with_discounts
    return desc


def _get_order_title(order, full_desc=False):
    pass


@app.task
def send_order_to_users(order_id, full_description=None):
    from orders_manager.models import Order
    from orders_manager.google_apis import GoogleApiHandler

    logger = get_task_logger(__name__)

    google_api_handler = GoogleApiHandler()
    order = Order.objects.get(id=order_id)

    if full_description is None:
        dt = datetime.datetime.strptime(
            '%s %s' % (order.celebrate_date, '00:00:00'), '%Y-%m-%d %H:%M:%S')
        today = datetime.datetime.now().replace(hour=0, minute=0, second=0,
                                                microsecond=0)
        dt_lim = today + datetime.timedelta(2)
        full_description = 0 < (dt_lim - dt).days <= 2

    date_str = '{0} {1}'.format(order.celebrate_date, order.celebrate_time)
    event_start = datetime.datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
    event_duration = int(order.duration)
    event_end = event_start + datetime.timedelta(0, event_duration * 60)
    description = _get_order_description(order, full_description)
    event_start = event_start.isoformat()
    event_end = event_end.isoformat()

    logger.debug('Sending order \'%s\' start \'%s\'' % (order.program.title,
                                                        event_start))

    for program_executor in order.program_executors.all():
        summary = order.program.title
        try:
            google_api_handler.send_event_to_user_calendar(
                program_executor.user, order.hex_id(), event_start, event_end,
                summary, description)
        except ValueError as ex:
            msg_txt = ex.args[0]
            if 'has no credentials' not in msg_txt:
                raise
            else:
                logger.warning(msg_txt)

    for service_to_executors in order.additional_services_executors.all():
        summary = ''

        if (service_to_executors.executor_id in
                [i.user.id for i in order.program_executors.all()]):
            summary = '%s | ' % order.program.title

        summary += service_to_executors.additional_service.title

        try:
            google_api_handler.send_event_to_user_calendar(
                service_to_executors.executor, order.hex_id(), event_start,
                event_end, summary, description)
        except ValueError as ex:
            msg_txt = ex.args[0]
            if 'has no credentials' not in msg_txt:
                raise
            else:
                logger.warning(msg_txt)

    return '{0} was updated.'.format(order.program.title)
