For this exercise, we will build a _single-page_ group chat web application with
asynchronous Javascript and a REST API written in Python with Flask.

Like the original, Watch Party 2 lets users start group chats and invite their
friends. This time, however, we serve a single static HTML page and never
redirect or reload. Instead, the page interacts purely with the JSON API.

Starting with the files included in this directory, implement the UI for Watch
Party in HTML, CSS, and Javascript, and serve it using server-side code written
in the
[latest stable version of Python](https://www.python.org/downloads/release/python-3112/)
([3.11.2](https://www.python.org/downloads/release/python-3112/)) and
[Flask](https://flask.palletsprojects.com/en/2.2.x/installation/). Routes to
serve the static content are provided, so you will only need to implement the
API endpoints in `app.py` and the javascript in `script.js`. You are however
free to modify any other file if it makes development more convenient.
