"""
Template context_processors
"""
import json

from django.conf import settings

from richie.apps.courses.models import Organization


def marketing_metas(request):
    """
    Context processor to add all information required by Marketing frontend scripts.
    """

    def get_organizations(page, language):
        """
        Return all organizations linked to the current page via an organization plugin
        in any of the placeholders on the page.
        """
        selector = "extended_object__organization_plugins__cmsplugin_ptr"
        filter_dict = {
            "{:s}__language".format(selector): language,
            "{:s}__placeholder__page".format(selector): page,
            "extended_object__title_set__published": True,
        }

        return list(
            organization.code
            for organization in Organization.objects.filter(**filter_dict)
            .select_related("extended_object")
            .distinct()
        )

    page = request.current_page or None

    context = {
        "MARKETING_CONTEXT": json.dumps(
            {
                "xiti": {
                    "level2": str(page.node.get_root().pk),
                    "organizations": get_organizations(page, request.LANGUAGE_CODE)
                    if not page.is_home
                    else [],
                    "site_id": getattr(settings, "MARKETING_SITE_ID", None),
                }
                if page is not None and page.publisher_is_draft is False
                else {}
            }
        )
    }

    return context
