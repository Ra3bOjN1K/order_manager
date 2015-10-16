# -*- coding: utf-8 -*-

from rolepermissions.roles import AbstractUserRole
from rolepermissions.shortcuts import retrieve_role

ROLES = [
    ('manager', 'Менеджер'),
    ('animator', 'Аниматор'),
    ('photographer', 'Фотограф'),
]


class Manager(AbstractUserRole):
    available_permissions = {
        'see_all_profiles': True,
        'see_profile_details': True,
        'delete_user': False,
        'see_customers': True,
        'add_customers': True,
        'see_customers_children': True,
        'see_all_orders': True,
        'see_all_debt_orders': True,
        'see_handbooks': True,
        'see_program_info': True,
        'add_program': True,
        'edit_program': True,
        'delete_program': True,
        'see_program_prices': True,
        'create_program_price': True,
        'delete_program_price': True,
        'see_additional_services': True,
        'see_executors': True,
        'see_executor_details': True,
        'see_discounts': True,
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


def set_user_role(user, role_name):
    from orders_manager.models import UserProfile

    role = retrieve_role(role_name)
    m_user = user
    if user and isinstance(user, UserProfile):
        m_user = user.user
    if role and m_user:
        role.assign_role_to_user(m_user)
