# -*- coding: utf-8 -*-
import requests
import json
from orders_manager.models import SmsDeliveryCredentials


class SmsDeliveryService:
    # SENDER = 'tilibom.by'
    SENDER = 'Vizitka'
    API_URL = 'http://cp.websms.by'
    SIZE_MESSAGES_BULK = 300
    REQUEST_TIMEOUT = 3  # sec

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

    def _generate_package(self, messages):
        package = []
        for msg in messages:
            package.append({
                'recipient': msg.recipient,
                'message': msg.message,
                'sender': self.SENDER
            })
        return package

    def _send_messages_bulk_response(self, user, apikey, messages):
        resp = requests.post(
            self.API_URL,
            {
                'r': 'msg_send_bulk',
                'user': user,
                'apikey': apikey,
                'messages': json.dumps(messages)
            }
        )
        return resp

    def send_messages(self, messages):
        credentials = self._get_credentials()
        package = self._generate_package(messages)
        start_bulk_idx = 0
        while start_bulk_idx < len(package):
            end_bulk_idx = start_bulk_idx + self.SIZE_MESSAGES_BULK
            self._send_messages_bulk_response(
                credentials.login,
                credentials.password,
                package[start_bulk_idx:end_bulk_idx]
            )
            start_bulk_idx = end_bulk_idx
            time.sleep(self.REQUEST_TIMEOUT)
