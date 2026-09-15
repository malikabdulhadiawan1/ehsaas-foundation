# Ehsaas Foundation static website

This folder is a repaired, self-contained version of the Weebly export.

## Preview locally

Serve this directory with any static web server and open `index.html`. For example, VS Code's Live Server extension works well.

## Publish

Upload everything in this directory while preserving the folder structure. The host's document root must contain:

- `index.html`
- the other five `.html` pages
- `files/`
- `uploads/`
- `apps/`

On conventional hosting this is usually `public_html`. If WordPress is installed at the domain root, place this site in a subdirectory or configure the server so `index.html` is served before WordPress's `index.php`.

## Contact form

The original form posted to Weebly and cannot receive submissions after migration. The repaired page validates the fields and directs visitors to the foundation's existing Facebook page. Connect the form to the chosen WordPress form plugin or hosted form endpoint when the final hosting destination is known.
