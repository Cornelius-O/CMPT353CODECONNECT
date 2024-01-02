
FROM node:latest
WORKDIR /app
RUN npm install -g create-react-app
# Expose port 
EXPOSE 3000
EXPOSE 8080
# Run the app
CMD ["/bin/bash"]


