FROM python:3-alpine

ENV SERVER_URL=http://webserver:3000

WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD [ "python", "./bot_controller.py", "-s", "./bot_fsm.py", "6"]