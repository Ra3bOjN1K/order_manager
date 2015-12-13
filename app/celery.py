# -*- coding: utf-8 -*-

from __future__ import absolute_import

import os

from celery import Celery
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
)

app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))
