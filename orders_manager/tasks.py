# -*- coding: utf-8 -*-

from app.celery import app

# from celery import Celery
# from django.conf import settings
#
# BROKER = 'amqp://{user}:{pass}@{host}:5672//'.format(
#     settings.RABBITMQ_USER, settings.RABBITMQ_PASSWORD, settings.RABBITMQ_HOST)
#
# app = Celery('tasks', broker=BROKER)


@app.task
def add(x, y):
    return x + y
