# Rowwise CSV Insights

A responsive CSV import and order analytics dashboard inspired by the CSV Upload and Placement Cell reporting projects in Bipul Kumar's resume. Built with HTML, CSS, and vanilla JavaScript.

## Features

- Drag a `.csv` file into the import area or browse to select one (up to 10 MB).
- Parse quoted fields and common alternate header names in the browser.
- View order count, paid revenue, average paid order, open orders, and revenue by category.
- Search records, filter by status, and export the currently visible rows as a CSV.
- Reload the included fictional sample orders at any time.

## CSV columns

The importer requires columns corresponding to order ID, customer, product, category, amount, status, and date. Common aliases such as `id`, `name`, `item`, `total`, `payment_status`, and `order_date` are accepted. Amounts can include a dollar sign or thousands separators. Status values are displayed as Paid, Pending, Processing, or Refunded; unrecognized values appear as Pending.

## Run and privacy

Open `index.html` in a modern browser and select **Load sample data**. Imported files are read and analyzed in the current browser tab; they are not sent to a server. No install, build step, or account is needed.

## Scope

This is a frontend demo with sample ecommerce data, not a production reporting system. It does not connect to a placement system, ecommerce platform, database, or API.
