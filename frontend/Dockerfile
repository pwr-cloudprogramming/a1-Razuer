FROM busybox:1.35

RUN adduser -D stud
USER stud
WORKDIR /home/stud

ARG IP

ENV IP=$IP

COPY src/ .

ENTRYPOINT ["busybox"]
CMD ["httpd", "-f", "-v", "-p", "3000"]
