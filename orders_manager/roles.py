# -*- coding: utf-8 -*-

from rolepermissions.roles import AbstractUserRole


class Manager(AbstractUserRole):
    available_permissions = {
        'see_all_orders': True,
        'see_all_debt_orders': True,
        'add_order': True,
        'change_order': True,
        'delete_order': True,
        'delete_all_orders_until_today': True,
        'assign_order': True,
        'assign_service': True,
    }


class Animator(AbstractUserRole):
    available_permission = {
        'see_my_orders': True,
        'see_my_debt_orders': True,
    }


class Photographer(AbstractUserRole):
    available_permission = {
        'see_my_orders': True,
        'see_my_debt_orders': True,
    }
