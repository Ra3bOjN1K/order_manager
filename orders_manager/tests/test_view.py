from django.test import SimpleTestCase, Client
from django.core.urlresolvers import reverse

from orders_manager.models import UserProfile
from orders_manager.utils.generate_data_helper import UserProfileGenerator


def _init_client(logged=False, role=None):
    client = Client()
    profile = None
    if logged:
        if not role:
            raise AttributeError('Role is not specified!')
        prof_gen = UserProfileGenerator()
        prof_gen.generate(role)
        profile = UserProfile.objects.filter(
            user__groups__name=role).first()
        client.login(username=profile.get_username(), password='12345')
    return client, profile


class AuthorizationViewTestCase(SimpleTestCase):
    def test_login_user(self):
        client, profile = _init_client()
        response = client.get(reverse('orders_manager:orders_list'))
        self.assertRedirects(
            response,
            reverse('orders_manager:login') + '?next=/orders/'
        )
        self.assertEqual(response.status_code, 302)
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.MANAGER)
        response = client.get(reverse('orders_manager:orders_list'))
        self.assertEqual(response.status_code, 200)

    def test_anonymous_change_password(self):
        client, _ = _init_client()
        response = client.get(reverse('orders_manager:change_password'))
        self.assertEqual(response.status_code, 404)

    def test_user_common_change_password(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.MANAGER)
        response = client.get(reverse('orders_manager:change_password'))
        self.assertEqual(response.status_code, 200)
        post_data = {
            'old_password': '12345',
            'new_password': '54321',
            'confirm_password': '54321'
        }
        response = client.post(
            reverse('orders_manager:change_password'), post_data)
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('orders_manager:login'))

    def test_change_password_fields(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.MANAGER)
        post_data = {
            'old_password': '',
            'new_password': '54321',
            'confirm_password': '54321'
        }
        response = client.post(
            reverse('orders_manager:change_password'), post_data)
        self.assertEqual(response.status_code, 200)
        post_data['old_password'] = '123'
        response = client.post(
            reverse('orders_manager:change_password'), post_data)
        self.assertEqual(response.status_code, 200)
        post_data['old_password'] = '12345'
        post_data['new_password'] = ''
        post_data['confirm_password'] = ''
        response = client.post(
            reverse('orders_manager:change_password'), post_data)
        self.assertEqual(response.status_code, 200)
        post_data['new_password'] = '1234'
        post_data['confirm_password'] = '12346'
        response = client.post(
            reverse('orders_manager:change_password'), post_data)
        self.assertEqual(response.status_code, 200)


class ActionsUnderUsersViewTestCase(SimpleTestCase):
    ############################################################
    # Test show all users permissions
    ############################################################
    def test_permissions_show_all_users_for_anonymous(self):
        client, _ = _init_client()
        response = client.get(reverse('orders_manager:profiles_list'))
        self.assertRedirects(
            response,
            reverse('orders_manager:login') + '?next=/users/'
        )
        self.assertEqual(response.status_code, 302)

    def test_permissions_show_all_users_for_managers(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.MANAGER)
        response = client.get(reverse('orders_manager:profiles_list'))
        self.assertEqual(response.status_code, 200)

    def test_permissions_show_all_users_for_animators(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.ANIMATOR)
        response = client.get(reverse('orders_manager:profiles_list'))
        self.assertEqual(response.status_code, 403)

    def test_permissions_show_all_users_for_photographer(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.PHOTOGRAPHER)
        response = client.get(reverse('orders_manager:profiles_list'))
        self.assertEqual(response.status_code, 403)

    ############################################################
    # Test show user details permissions
    ############################################################
    def test_permissions_show_user_details_for_anonymous(self):
        client, _ = _init_client()
        profile = UserProfileGenerator().generate(
            role=UserProfileGenerator.MANAGER).pop(0)
        response = client.get(
            reverse('orders_manager:user_profile',
                    kwargs={'username': profile.get_username()}))
        self.assertRedirects(
            response,
            reverse('orders_manager:login') + '?next={}'.format(reverse(
                'orders_manager:user_profile',
                kwargs={'username': profile.get_username()}))
        )
        self.assertEqual(response.status_code, 302)

    def test_permissions_show_my_profile_details(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.MANAGER)
        response = client.get(reverse('orders_manager:my_profile'))
        self.assertEqual(response.status_code, 200)
        profile.user.is_superuser = True
        profile.user.save()
        response = client.get(reverse('orders_manager:my_profile'))
        self.assertEqual(response.status_code, 404)

    def test_permissions_show_user_details_for_managers(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.MANAGER)
        response = client.get(
            reverse('orders_manager:user_profile',
                    kwargs={'username': profile.get_username()}))
        self.assertEqual(response.status_code, 200)

    def test_permissions_show_user_details_for_animators(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.ANIMATOR)
        response = client.get(
            reverse('orders_manager:user_profile',
                    kwargs={'username': profile.get_username()}))
        self.assertEqual(response.status_code, 403)

    def test_permissions_show_user_details_for_photographer(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.PHOTOGRAPHER)
        response = client.get(
            reverse('orders_manager:user_profile',
                    kwargs={'username': profile.get_username()}))
        self.assertEqual(response.status_code, 403)

    ############################################################
    # Test edit user permissions
    ############################################################
    def test_permissions_edit_user_for_anonymous(self):
        client, _ = _init_client()
        profile = UserProfileGenerator().generate(
            role=UserProfileGenerator.MANAGER).pop(0)
        response = client.get(
            reverse('orders_manager:edit_user',
                    kwargs={'username': profile.get_username()}))
        self.assertRedirects(
            response,
            reverse('orders_manager:login') + '?next={}'.format(reverse(
                'orders_manager:edit_user',
                kwargs={'username': profile.get_username()}))
        )
        self.assertEqual(response.status_code, 302)

    def test_permissions_edit_user_for_managers(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.MANAGER)
        response = client.get(
            reverse('orders_manager:edit_user',
                    kwargs={'username': profile.get_username()}))
        self.assertEqual(response.status_code, 403)

    def test_permissions_edit_user_for_animators(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.ANIMATOR)
        response = client.get(
            reverse('orders_manager:edit_user',
                    kwargs={'username': profile.get_username()}))
        self.assertEqual(response.status_code, 403)

    def test_permissions_edit_user_for_photographer(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.PHOTOGRAPHER)
        response = client.get(
            reverse('orders_manager:edit_user',
                    kwargs={'username': profile.get_username()}))
        self.assertEqual(response.status_code, 403)

    ############################################################
    # Test delete user permissions
    ############################################################
    def test_permissions_delete_user_for_anonymous(self):
        client, _ = _init_client()
        profile = UserProfileGenerator().generate(
            role=UserProfileGenerator.MANAGER).pop(0)
        response = client.get(
            reverse('orders_manager:delete_user',
                    kwargs={'username': profile.get_username()}))
        self.assertRedirects(
            response,
            reverse('orders_manager:login') + '?next={}'.format(reverse(
                'orders_manager:delete_user',
                kwargs={'username': profile.get_username()}))
        )
        self.assertEqual(response.status_code, 302)

    def test_permissions_delete_user_for_managers(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.MANAGER)
        response = client.get(
            reverse('orders_manager:delete_user',
                    kwargs={'username': profile.get_username()}))
        self.assertEqual(response.status_code, 403)

    def test_permissions_delete_user_for_animators(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.ANIMATOR)
        response = client.get(
            reverse('orders_manager:delete_user',
                    kwargs={'username': profile.get_username()}))
        self.assertEqual(response.status_code, 403)

    def test_permissions_delete_user_for_photographer(self):
        client, profile = _init_client(logged=True,
                                       role=UserProfileGenerator.PHOTOGRAPHER)
        response = client.get(
            reverse('orders_manager:delete_user',
                    kwargs={'username': profile.get_username()}))
        self.assertEqual(response.status_code, 403)
