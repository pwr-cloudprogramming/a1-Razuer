FROM node:lts

WORKDIR /usr/src/app

COPY public/ ./public
COPY src/ ./src
COPY package.json .

# Pobierz zmienne środowiskowe
ENV REACT_APP_COGNITO_REGION=$REACT_APP_COGNITO_REGION
ENV REACT_APP_COGNITO_USERPOOLID=$REACT_APP_COGNITO_USERPOOLID
ENV REACT_APP_COGNITO_CLIENTID=$REACT_APP_COGNITO_CLIENTID
ENV REACT_APP_BACKEND_IP=$REACT_APP_BACKEND_IP
ENV REACT_APP_API_GATEWAY_URL=$REACT_APP_API_GATEWAY_URL

RUN yarn install

EXPOSE 3000

CMD ["npm", "start"]
