# -*- coding: utf-8 -*-
import time
import requests
import json
from orders_manager.models import SmsDeliveryCredentials


class SmsDeliveryService:
    API_URL = 'http://cp.websms.by'
    SIZE_MESSAGES_BULK = 300
    REQUEST_TIMEOUT = 3  # sec

    def save_api_settings(self, login, apikey, sender):
        credential = SmsDeliveryCredentials.objects.first()
        if credential:
            credential.login = login
            credential.password = apikey
            credential.sender = sender
            credential.save()
        else:
            SmsDeliveryCredentials(
                login=login,
                password=apikey,
                sender=sender
            ).save()

    def get_api_settings(self):
        settings = SmsDeliveryCredentials.objects.first()
        if settings:
            return {
                'login': settings.login,
                'apikey': settings.password,
                'sender': settings.sender
            }
        return {'login': '', 'apikey': '', 'sender': ''}

    def _generate_package(self, messages, sender):
        package = []
        for msg in messages:
            package.append({
                'recipient': msg.get('recipient'),
                'message': msg.get('message'),
                'sender': sender
            })
        return package

    def _send_messages_bulk_response(self, user, apikey, messages):
        resp = requests.post(
            self.API_URL,
            {
                'r': 'api/msg_send_bulk',
                'user': user,
                'apikey': apikey,
                'messages': json.dumps(messages)
            }
        )
        resp_json = json.loads(resp.text)
        if resp_json.get('status') == 'error':
            raise ValueError(resp_json.get('message'))

    def send_messages(self, messages):
        settings = self.get_api_settings()
        package = self._generate_package(messages, settings['sender'])
        start_bulk_idx = 0
        while start_bulk_idx < len(package):
            end_bulk_idx = start_bulk_idx + self.SIZE_MESSAGES_BULK
            self._send_messages_bulk_response(
                settings['login'],
                settings['password'],
                package[start_bulk_idx:end_bulk_idx]
            )
            start_bulk_idx = end_bulk_idx
            time.sleep(self.REQUEST_TIMEOUT)
