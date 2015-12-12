# -*- coding: utf-8 -*-

import httplib2
import os
from apiclient import discovery
from oauth2client.client import OAuth2WebServerFlow
from oauth2client.django_orm import Storage

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.email']
CLIENT_ID = '501382837218-cluipcqlmcqo24he2so0g8g1s5l7dlqn.apps.googleusercontent.com'
CLIENT_SECRET = 'o3U6_5YhSpnFD8TF5QOrmqK5'
REDIRECT_URL = 'urn:ietf:wg:oauth:2.0:oob'


class GoogleAuth:
    oauth_flow = None

    def __init__(self):
        self.oauth_flow = OAuth2WebServerFlow(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            scope=SCOPES,
            redirect_uri=REDIRECT_URL,
            access_type='offline'
        )

    def get_auth_uri(self):
        return self.oauth_flow.step1_get_authorize_url()

    def exchange_auth_code(self, auth_code):
        return self.oauth_flow.step2_exchange(auth_code)

    def update_user_credentials(self, new_credential):
        from orders_manager.models import CredentialsModel, User

        user = User.objects.get(email=self.get_google_user_email(new_credential))
        storage = Storage(CredentialsModel, 'id', user, 'credential')
        storage.put(new_credential)
        return storage.get()


    def get_user_credentials(self, user):
        from orders_manager.models import CredentialsModel

        storage = Storage(CredentialsModel, 'id', user, 'credential')
        credential = storage.get()
        if credential.access_token_expired:
            http = credential.authorize(httplib2.Http())
            credential.refresh(http)
        return credential

    def get_google_user_email(self, credentials):
        http = credentials.authorize(httplib2.Http())

        user_service = discovery.build('oauth2', 'v2', http=http)
        my_profile = user_service.userinfo().get().execute()

        return my_profile.get('email', '')

    def get_google_user_calendars(self, credentials):
        http = credentials.authorize(httplib2.Http())
        service = discovery.build('calendar', 'v3', http=http)

        calendar_list = service.calendarList().list().execute()

        # eventsResult = service.events().list(
        #     calendarId='tolik.rakushka@gmail.com').execute()
        # events = eventsResult.get('items', [])
        #
        # if not events:
        #     print('No upcoming events found.')
        # for event in events:
        #     start = event['start'].get('dateTime', event['start'].get('date'))
        #     print(start, event['summary'])
