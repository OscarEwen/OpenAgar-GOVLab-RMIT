FROM python:3-alpine

ENV SERVER_URL=http://keen-radiance.railway.internal:8080

WORKDIR /usr/src/app

ENV BUILD_VERSION=2

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD [ "python", "./bot_controller.py", "-s", "./bot_fsm.py", "6"]