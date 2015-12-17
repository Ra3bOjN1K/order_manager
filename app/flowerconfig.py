# -*- coding: utf-8 -*-

from __future__ import absolute_import
import os
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

BROKER_URL = 'amqp://{0}:{1}@localhost:5672/{2}'.format(
    settings.RABBITMQ_USER, settings.RABBITMQ_PASSWORD, settings.RABBITMQ_HOST)
