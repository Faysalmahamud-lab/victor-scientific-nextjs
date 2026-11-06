# Legacy URL parity map

The source `routes/web.php` and `routes/api.php` declarations are extracted to `migration-data/legacy-route-inventory.json` for review.

| Legacy URL family | New application status |
|---|---|
| `/` | Implemented |
| `/site/contact-us` | Implemented as a general company enquiry page |
| `/company` | New company information page |
| `/admin/*` | New protected admin shell and read-only CMS metadata view |
| `/sitemap.xml` | Implemented with neutral public pages only |
| `/robots.txt` | Implemented; admin/API and disabled legacy content paths are disallowed |
| `/shop`, `/category/*`, `/subcategory/*`, `/products/*`, `/product/*`, `/brands`, `/search` | Deliberately not exposed in this package |
| `/offer`, `/hot-deals`, `/flash-sales`, `/campaign/*` | Not migrated |
| `/cart/*`, `/checkout`, payment callbacks and order routes | Not migrated |
| `/page/*` | Not publicly rendered until legacy CMS body content has been reviewed |

This map is not a claim that every legacy route has been migrated. The JSON inventory is the source route list for a later, scope-approved parity pass. The new application does not return legacy product/catalogue content.
