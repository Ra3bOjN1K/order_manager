# -*- coding: utf-8 -*-

import random
import string
import datetime


def generate_str(num_chars=3):
    value = ''.join(
        random.choice(
            string.ascii_uppercase + string.ascii_lowercase
        ) for _ in range(num_chars)
    )
    return value


def format_date(date_time=None, pattern='%Y%m%d_%H%M%S'):
    date_time = date_time or datetime.datetime.now()
    return date_time.strftime(pattern)


def calculate_age(born):
    today = datetime.date.today()
    try:
        birthday = born.replace(year=today.year)
    except ValueError:
        # raised when birth date is February 29 and the current year is not
        # a leap year
        birthday = born.replace(year=today.year, month=born.month + 1, day=1)
    if birthday > today:
        return today.year - born.year - 1
    else:
        return today.year - born.year


def day_of_month_full_name(short_name):
    return {
        'ПН': 'Понедельник',
        'ВТ': 'Вторник',
        'СР': 'Среда',
        'ЧТ': 'Четверг',
        'ПТ': 'Пятница',
        'СБ': 'Суббота',
        'ВС': 'Воскресенье'
    }.get(short_name, 'Unknown short_name \'%s\'' % short_name)
