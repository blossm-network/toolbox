# https://github.com/excellalabs/mongo-docker
# http://blog.bejanalex.com/2017/03/running-mongodb-in-a-docker-container-with-authentication/
# https://docs.mongodb.com/v2.6/tutorial/add-user-administrator/
#https://stackoverflow.com/questions/42912755/how-to-create-a-db-for-mongodb-container-on-start-up/42917632#42917632
#https://github.com/docker/hub-feedback/issues/1255
#https://github.com/docker-library/mongo/issues/263

FROM mongo:4.0.9

COPY mongo-init.sh /docker-entrypoint-initdb.d/
# COPY 1-init.sh /docker-entrypoint-initdb.d/
# COPY 2-seed.sh /docker-entrypoint-initdb.d/

