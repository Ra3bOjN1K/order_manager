# -*- coding: utf-8 -*-

from django.contrib.auth.models import Group

from guardian.shortcuts import assign_perm


ROLES = [
    ('superuser', 'Администратор'),
    ('manager', 'Менеджер'),
    ('animator', 'Аниматор'),
    ('photographer', 'Фотограф'),
]


class AbstractUserRole:
    group_name = ''
    available_permissions = ()

    def init_role(self):
        try:
            group = Group.objects.get(name=self.group_name)
        except Group.DoesNotExist:
            group = Group.objects.create(name=self.group_name)

        group_perms = [x.name for x in group.permissions.all()]

        for perm in self.available_permissions:
            if perm not in group_perms:
                assign_perm('orders_manager.%s' % perm, group)

    @classmethod
    def assign_role_to_user(cls, user):
        group = Group.objects.get(name=cls.group_name)
        user = user if not hasattr(user, 'user') else user.user
        group.user_set.add(user)
        group.save()

    @classmethod
    def change_user_role(cls, user, new_role):
        user = user if not hasattr(user, 'user') else user.user
        user.groups.clear()
        group = Group.objects.get(name=new_role)
        group.user_set.add(user)
        group.save()


class Superuser(AbstractUserRole):
    group_name = 'superuser'

    available_permissions = (
        'see_all_profiles',
        'see_executors',
        'see_profile_details',
        'add_userprofile',
        'change_userprofile',
        'delete_userprofile',
        'add_dayoff',
        'change_dayoff',
        'delete_dayoff',
        'see_client',
        'see_client_details',
        'add_client',
        'change_client',
        'delete_client',
        'see_client_children',
        'add_clientchild',
        'change_clientchild',
        'delete_clientchild',
        'see_additionalservices',
        'add_additionalservice',
        'change_additionalservice',
        'assign_additionalservice',
        'delete_additionalservice',
        'see_programs',
        'see_program_details',
        'add_program',
        'change_program',
        'delete_program',
        'see_program_prices',
        'add_programprice',
        'change_programprice',
        'delete_programprice',
        'see_discounts',
        'add_discount',
        'change_discount',
        'delete_discount',
        'see_orders',
        'add_order',
        'change_order',
        'assign_order',
        'delete_order',
        'see_handbooks',
    )


class Manager(AbstractUserRole):
    group_name = 'manager'

    available_permissions = (
        'see_all_profiles',
        'see_executors',
        'see_profile_details',
        'add_userprofile',
        'change_userprofile',
        'add_dayoff',
        'change_dayoff',
        'delete_dayoff',
        'see_client',
        'see_client_details',
        'add_client',
        'change_client',
        'delete_client',
        'see_client_children',
        'add_clientchild',
        'change_clientchild',
        'delete_clientchild',
        'see_additionalservices',
        'add_additionalservice',
        'change_additionalservice',
        'assign_additionalservice',
        'delete_additionalservice',
        'see_programs',
        'see_program_details',
        'add_program',
        'change_program',
        'delete_program',
        'see_program_prices',
        'add_programprice',
        'change_programprice',
        'delete_programprice',
        'see_discounts',
        'add_discount',
        'change_discount',
        'delete_discount',
        'see_orders',
        'add_order',
        'change_order',
        'assign_order',
        'delete_order',
        'see_handbooks',
    )


class Animator(AbstractUserRole):
    group_name = 'animator'

    available_permissions = (
        'see_orders',
        'see_executors',
        'see_client_details',
        'see_client_children',
        'see_program_details',
        'see_additionalservices',
        'see_discounts',
    )


class Photographer(AbstractUserRole):
    group_name = 'photographer'

    available_permissions = (
        'see_orders',
        'see_executors',
        'see_client_details',
        'see_client_children',
        'see_program_details',
        'see_additionalservices',
        'see_discounts',
    )


def init_roles():
    roles = (
        Superuser(),
        Manager(),
        Animator(),
        Photographer()
    )

    for role in roles:
        role.init_role()


def get_user_role(user):
    user = user if not hasattr(user, 'user') else user.user
    user_groups = user.groups.values_list('name',flat=True)
    if user_groups:
        return user_groups[0]
    raise AttributeError('User has no role!')
