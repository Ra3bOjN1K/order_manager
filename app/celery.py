# -*- coding: utf-8 -*-

from __future__ import absolute_import

import os

from celery import Celery
from django.conf import settings


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

app = Celery('app')

app.config_from_object('django.conf:settings')

app.conf.update(
    BROKER_URL='amqp://{user}:{pwd}@{host}:5672//'.format(
        user=settings.RABBITMQ_USER, pwd=settings.RABBITMQ_PASSWORD,
        host=settings.RABBITMQ_HOST)
)

app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))
