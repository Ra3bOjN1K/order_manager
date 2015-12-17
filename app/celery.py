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
    CELERY_TIMEZONE=settings.TIME_ZONE,
    CELERY_ENABLE_UTC=True
)

app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


def get_tasks_logger():
    import logging

    logger = logging.getLogger('celery.tasks')
    if os.path.exists(settings.CELERY_TASKS_LOG_DIR_PATH):
        handler = logging.FileHandler(
            os.path.join(settings.CELERY_TASKS_LOG_DIR_PATH, 'tasks.log'))
        formatter = logging.Formatter('%(asctime)-15s %(levelname)-8s %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False
    else:
        raise IOError('Logs dir doesn\'t exists!')

    return logger


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))
