FROM python:3.12-alpine

WORKDIR /app

RUN pip install requests

COPY send_discord.py /app/send_discord.py

ENTRYPOINT ["python", "/app/send_discord.py"]
