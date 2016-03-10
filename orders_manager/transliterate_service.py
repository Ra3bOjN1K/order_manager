# -*- coding: utf-8 -*-

from transliterate import translit


def need_transliteration():
    from orders_manager.models import SmsDeliveryCredentials
    settings = SmsDeliveryCredentials.objects.first()
    return settings.transliterate if settings else False


def transliterate_message(message, reverse=True):
    return translit(message, language_code='ru', reversed=reverse)
