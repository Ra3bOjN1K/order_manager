# -*- coding: utf-8 -*-

from django import template

register = template.Library()


@register.inclusion_tag('orders_manager/tags/_user_profile_info_line.html')
def show_user_info_line(users):
    return {
        'users': users
    }


@register.filter
def match_url_pattern(url, pattern_name):
    from orders_manager.urls import urlpatterns
    patterns = [x for x in urlpatterns if x.name == pattern_name]
    if patterns:
        url = url[1:] if url.startswith('/') else url
        return patterns.pop(0).resolve(url)
    raise AttributeError('Pattern "%s" not found!' % pattern_name)
