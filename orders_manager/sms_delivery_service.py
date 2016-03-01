# -*- coding: utf-8 -*-
from django.template.loader import render_to_string

from orders_manager.models import SmsDeliveryCredentials


class SmsDeliveryService:
    SENDER = 'tilibom.by'

    def save_credentials(self, login, password):
        credential = SmsDeliveryCredentials.objects.first()
        if credential:
            credential.login = login
            credential.password = password
            credential.save()
        else:
            SmsDeliveryCredentials(login=login, password=password).save()

    def _get_credentials(self):
        return SmsDeliveryCredentials.objects.first()

    def send_messages(self, messages, sender=SENDER):
        credentials = self._get_credentials()

    def send_message(self, message, credentials=None, sender=SENDER):
        if not credentials:
            credentials = self._get_credentials()

    def _render_send_template_to_string(self, message):
        xml = render_to_string(
            'orders_manager/sms_requests/send_sms_request.xml',
            {}
        )
        return xml

    def test_send_message(self):
        pass


