# -*- coding: utf-8 -*-

from django import template

register = template.Library()


@register.inclusion_tag('orders_manager/tags/_user_profile_info_line.html')
def show_user_info_line(users):
    return {
        'users': users
    }


@register.inclusion_tag('orders_manager/tags/_price_form.html')
def show_program_price_form(form):
    return {
        'price_form': form
    }


@register.filter
def match_url_pattern(url, pattern_name):
    from orders_manager.urls import urlpatterns

    patterns = [x for x in urlpatterns if x.name == pattern_name]
    if patterns:
        url = url[1:] if url.startswith('/') else url
        return patterns.pop(0).resolve(url)
    raise AttributeError('Pattern "%s" not found!' % pattern_name)


@register.simple_tag(takes_context=True)
def menu_btn_active(context, pattern_name):
    from orders_manager.urls import urlpatterns
    import re

    url_rex = re.match('/[^/]+/', context.request.path)
    url = url_rex.group(0) if url_rex else ''

    patterns = [x for x in urlpatterns if x.name == pattern_name]
    if patterns:
        url = url[1:] if url.startswith('/') else url
        is_active = patterns.pop(0).resolve(url) is not None
        return ' active' if is_active else ''
    else:
        raise AttributeError('Pattern "%s" not found!' % pattern_name)


@register.simple_tag(takes_context=True)
def hbook_active(context, pattern_name):
    from orders_manager.urls import urlpatterns

    url = context.request.path
    patterns = [x for x in urlpatterns if x.name == pattern_name]
    if patterns:
        url = url[1:] if url.startswith('/') else url
        is_active = patterns.pop(0).resolve(url) is not None
        return ' active' if is_active else ''
    else:
        raise AttributeError('Pattern "%s" not found!' % pattern_name)
