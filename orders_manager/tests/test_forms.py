# -*- coding: utf-8 -*-

from django.test import TestCase

from orders_manager.forms import UserPasswordChangeForm, \
    UpdateUserProfileForm, CreateUserProfileForm
from orders_manager.utils.generate_data_helper import UserProfileGenerator


##############################################
# Test authorization forms
##############################################
class ChangePasswordFormTestCase(TestCase):
    form_data = {
        'old_password': '12345',
        'new_password': '123456',
        'confirm_password': '123456',
    }

    def setUp(self):
        self.user_profile = UserProfileGenerator().generate(
            role=UserProfileGenerator.MANAGER).pop(0)

    def test_change_password_common_case(self):
        m_data = {
            'user': self.user_profile.user
        }
        form = UserPasswordChangeForm(data=self.form_data, **m_data)
        self.assertTrue(form.is_valid())
        form.save()
        self.assertTrue(self.user_profile.user.check_password(
            self.form_data.get('new_password')))

    def test_change_password_empty_old_password(self):
        m_data = {
            'user': self.user_profile.user
        }
        self.form_data['old_password'] = ' '
        form = UserPasswordChangeForm(data=self.form_data, **m_data)
        self.assertFalse(form.is_valid())

    def test_change_password_empty_new_password(self):
        m_data = {
            'user': self.user_profile.user
        }
        self.form_data['new_password'] = ' '
        form = UserPasswordChangeForm(data=self.form_data, **m_data)
        self.assertFalse(form.is_valid())

    def test_change_password_passwords_dont_match(self):
        m_data = {
            'user': self.user_profile.user
        }
        self.form_data['new_password'] = '54321'
        self.form_data['confirm_password'] = '541'
        form = UserPasswordChangeForm(data=self.form_data, **m_data)
        self.assertFalse(form.is_valid())


##############################################
# Test forms for actions under users
##############################################
class EditUserProfileFormTestCase(TestCase):
    def setUp(self):
        self.my_profile = UserProfileGenerator().generate(
            role=UserProfileGenerator.MANAGER).pop(0)

    def test_edit_user_profile_common_case(self):
        m_data = {
            'user': self.my_profile.user
        }

        form = UpdateUserProfileForm(**m_data)
        self.assertTrue(form.is_valid())


class CreateUserProfileFormTestCase(TestCase):
    def setUp(self):
        self.my_profile = UserProfileGenerator().generate(
            role=UserProfileGenerator.MANAGER).pop(0)

    def test_create_user_profile_common_case(self):
        m_data = dict(
            username=self.my_profile.get_username(),
            first_name=self.my_profile.get_first_name(),
            last_name=self.my_profile.get_last_name(),
            email=self.my_profile.get_email(),
            phone=self.my_profile.get_phone(),
            address=self.my_profile.get_address(),
            weekends=['wed', 'mon'],
            password='12345',
            confirm_password='12345'
        )

        form = CreateUserProfileForm(data=m_data, **{'user_role': 'manager'})
        self.assertTrue(form.is_valid())
