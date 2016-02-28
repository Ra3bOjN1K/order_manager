# -*- coding: utf-8 -*-

from __future__ import absolute_import

import os

from celery import Celery
from celery.schedules import crontab
from django.conf import settings


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

app = Celery('app')

app.config_from_object('django.conf:settings')

app.conf.update(
    BROKER_URL='amqp://{0}:{1}@localhost:5672/{2}'.format(
        settings.RABBITMQ_USER, settings.RABBITMQ_PASSWORD,
        settings.RABBITMQ_HOST),
    CELERY_RESULT_BACKEND='amqp://{0}:{1}@localhost:5672/{2}'.format(
        settings.RABBITMQ_USER, settings.RABBITMQ_PASSWORD,
        settings.RABBITMQ_HOST),
    CELERY_ACCEPT_CONTENT=['json'],
    CELERY_TASK_SERIALIZER='json',
    CELERY_RESULT_SERIALIZER='json',
    CELERY_TIMEZONE=settings.TIME_ZONE,
    CELERY_ENABLE_UTC=True,
    CELERYBEAT_SCHEDULE={
        'update-google-orders-every-night': {
            'task': 'orders_manager.tasks.cyclically_update_orders_to_google_calendars',
            'schedule': crontab(minute=5, hour='*/12'),
            'args': (),
        },
        'set-debtors': {
            'task': 'orders_manager.tasks.set_debtors',
            'schedule': crontab(minute='*/30', hour='6-23'),
            'args': (),
        },
        'run-generating-sms-messages': {
            'task': 'orders_manager.tasks.run_generating_sms_messages',
            'schedule': crontab(minute=0, hour=2),
            'args': (),
        }
    }
)

app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))
