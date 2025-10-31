# Simple CORS middleware so the Vite dev server can talk to Django without extra packages.
from datetime import timedelta

class SimpleCORS:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            from django.http import HttpResponse
            response = HttpResponse()
            self.add_headers(response)
            return response
        response = self.get_response(request)
        self.add_headers(response)
        return response

    def add_headers(self, response):
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Headers"] = "Origin, Content-Type, Accept, Authorization"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Max-Age"] = "86400"
        return response
