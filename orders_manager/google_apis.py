# -*- coding: utf-8 -*-

import httplib2
import os
import simplejson
from apiclient import discovery, errors
from oauth2client.client import OAuth2WebServerFlow
from oauth2client.django_orm import Storage
from django.conf import settings

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class GoogleApiHandler:
    TILIBOM_CALENDAR_SUMMARY = 'Tilibom\'s calendar'
    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email'
    ]

    oauth_flow = None

    def __init__(self, **kwargs):
        self.oauth_flow = OAuth2WebServerFlow(
            client_id=settings.OAUTH_CLIENT_ID,
            client_secret=settings.OAUTH_CLIENT_SECRET,
            scope=self.SCOPES,
            redirect_uri=settings.OAUTH_REDIRECT_URL,
        )
        if kwargs.get("grant_type", None) == "online":
            # self.oauth_flow.params['grant_type'] = 'access_type',
            self.oauth_flow.params['approval_prompt'] = 'force'
        else:
            self.oauth_flow.params['grant_type'] = 'refresh_token',
            self.oauth_flow.params['access_type'] = 'offline',

        self.oauth_flow.params['include_granted_scopes'] = 'true'

    def get_auth_uri(self):
        return self.oauth_flow.step1_get_authorize_url()

    def exchange_auth_code(self, auth_code):
        return self.oauth_flow.step2_exchange(auth_code)

    def update_user_credentials(self, new_credential):
        from orders_manager.models import CredentialsModel, User

        user = User.objects.get(
            email=self.get_google_user_email(new_credential))
        storage = Storage(CredentialsModel, 'id', user, 'credential')
        storage.put(new_credential)
        return storage.get()

    def _get_user_credentials(self, user):
        from orders_manager.models import CredentialsModel

        user = user if not hasattr(user, 'user') else user.user

        try:
            storage = Storage(CredentialsModel, 'id', user, 'credential')
            credential = storage.get()
        except:
            raise ValueError('Credentials for user \'%s\' was not found!' %
                             user.profile.get_full_name())

        if not credential:
            raise ValueError('User \'%s\' has no credentials' %
                             user.profile.get_full_name())

        if credential.invalid:
            raise ValueError('Credentials are invalid for user \'%s\'!' %
                             user.profile.get_full_name())

        try:
            if credential.access_token_expired:
                http = credential.authorize(httplib2.Http())
                credential.refresh(http)
        except Exception as ex:
            raise ValueError('Bad user credentials! ' + ex.args[0])

        return credential

    def get_google_user_email(self, credentials):
        http = credentials.authorize(httplib2.Http())
        user_service = discovery.build('oauth2', 'v2', http=http)
        my_profile = user_service.userinfo().get().execute()

        return my_profile.get('email', '')

    def _get_calendar_service(self, credentials):
        http = credentials.authorize(httplib2.Http())
        return discovery.build('calendar', 'v3', http=http)

    def _create_calendar_if_required(self, credentials):
        service = self._get_calendar_service(credentials)
        calendar_id = 'None'
        calendar_list = service.calendarList().list().execute()

        if (self.TILIBOM_CALENDAR_SUMMARY not in
                [i.get('summary') for i in calendar_list.get('items')]):
            calendar_body = {
                'kind': 'calendar#calendar',
                'summary': self.TILIBOM_CALENDAR_SUMMARY,
                'timeZone': 'Europe/Minsk',
            }
            calendar = service.calendars().insert(body=calendar_body).execute()
            calendar_id = calendar.get('id')
            print('Calendar created: %s' % (calendar.get('summary')))
        else:
            for item in calendar_list.get('items'):
                if item.get('summary') == self.TILIBOM_CALENDAR_SUMMARY:
                    calendar_id = item.get('id')
                    break

        return calendar_id

    def send_event_to_user_calendar(self, user, event_id, start, end, summary,
                                    description):
        credentials = self._get_user_credentials(user)
        service = self._get_calendar_service(credentials)

        event = {
            'id': event_id,
            'summary': summary,
            'location': '',
            'description': description,
            'start': {
                'dateTime': start,
                'timeZone': 'Europe/Minsk',
            },
            'end': {
                'dateTime': end,
                'timeZone': 'Europe/Minsk',
            },
            'reminders': {
                'useDefault': True,
            },
        }

        calendar_id = self._create_calendar_if_required(credentials)

        try:
            service.events().get(
                calendarId=calendar_id, eventId=event_id).execute()
            event = service.events().update(
                calendarId=calendar_id, eventId=event_id, body=event
            ).execute()
        except errors.HttpError as ex:
            error = simplejson.loads(ex.content).get('error', {})
            if error.get('code') == 404:
                event = service.events().insert(
                    calendarId=calendar_id, body=event).execute()
            else:
                raise

        return event

    def delete_event_from_user_calendar(self, user, event_id):

        credentials = self._get_user_credentials(user)
        service = self._get_calendar_service(credentials)

        calendar_id = self._create_calendar_if_required(credentials)

        try:
            service.events().delete(
                calendarId=calendar_id, eventId=event_id).execute()
        except errors.HttpError as ex:
            error = simplejson.loads(ex.content).get('error', {})
            if not error.get('code') == 404:
                raise
            else:
                return 'Event with id=%s was not found!' % event_id

        return 'Success'
