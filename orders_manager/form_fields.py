# -*- coding: utf-8 -*-

from django import forms
from django.utils.safestring import mark_safe


class CheckboxToButtonSelectMultiple(forms.CheckboxSelectMultiple):
    def render(self, name, value, attrs=None, choices=()):
        value = value or []
        out_body = ''
        disabled = 'disabled' if self.attrs.get('readonly') else ''
        for item in self.choices:
            i_code, i_name = item
            checked = 'checked' if i_code in value else ''
            out_body += \
                '<div id="{0}-btn">' \
                '<label>' \
                '<input type="checkbox" value="{0}" name="{2}" {ch} {d}>' \
                '<span>{1}</span>' \
                '</label>' \
                '</div>'.format(i_code, i_name, name, ch=checked, d=disabled)
        output = "<div class='multiple-btns-group' id='{id}'>" \
                 "{content}</div>".format(id=name, content=out_body)
        return mark_safe(output)


class RadioButtonToButtonSelect(forms.RadioSelect):
    def render(self, name, value, attrs=None, choices=()):
        value = value or []
        out_body = ''
        disabled = 'disabled' if self.attrs.get('readonly') else ''
        for item in self.choices:
            i_code, i_name = item
            checked = 'checked="checked"' if i_code in value else ''
            out_body += \
                '<div id="{0}-btn">' \
                '<label>' \
                '<input type="radio" value="{0}" name="{2}" {checked} {d}>' \
                '<span>{1}</span>' \
                '</label>' \
                '</div>'.format(i_code, i_name, name, checked=checked,
                                d=disabled)
        output = "<div class='radio-btns-group' id='{id}'>" \
                 "{content}</div>".format(id=name, content=out_body)
        return mark_safe(output)
