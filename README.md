# Intelligent-Grouping-App
![Intelligent Grouping Logo](/static/images/blue-bg.svg)
## Overview:
The Intelligent Grouping web application is a website designed to provide teachers with the tools to group their students together for various classroom purposes, with a high degree of customizability and ease-of-use.
## Features:
* Easy Google authentication for signin.
* Import class rosters through a .CSV file upload (follows Infinite Campus' format).
* Manually create class rosters through an input system.
* Generate random groupings of a specified number of groups or group size.
## Instructions:
* After the website finishes loading, simply press the "Sign in with Google" button and sign in using whatever email you wish, keeping in mind that that email is your account for this website.
* To add classes, simply click the "Add Class" button in the bottom left of the screen.
  * For manual entry, click the manual entry button in the popup and input your students one by one. Afterward, click "save" to save the completed manual class.
  * For automatic fillin with a .CSV file, click "Import Class Roster" on the popup and select the desired CSV file from Infinite Campus to add your classes.
* Instructions for basic random groups.
  * Click the desired class in the sidebar.
  * In the panel, select "Create grouping".
  * Click the large plus button in the main canvas to add a grouping.
  * Click the "Arrange Students" button.
  * Select "Random Grouping".
  * Input the desired parameters (amount of groups made or people per group).
  * Submit your response.
### Production Server Deployment
1. Create a new EC2 instance used on Ubuntu.
2. Open ports for HTTP and HTTPS when walking through the EC2 wizard.
3. Generate a key pair for this EC2 instance. Download and save the private key, which is needed to connect to the instance in the future.
4. After the EC2 instance is running, click on the Connect button the EC2 Management Console for instructions on how to ssh into the instance.
5. On the EC2 instance, [install](https://github.com/nodesource/distributions/blob/master/README.md) Node.js v12

```
curl -fsSL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
```

6. On the EC2 instance, install nginx: `sudo apt-get -y install nginx`
7. Create a reverse proxy for the Intelligent Grouping App node server. In the file /etc/nginx/sites-enabled/intelligentgrouping:

```
server {
	# listen on port 80 (http)
	listen 80;
	server_name intelligentgrouping.nnhsse.org;

	# write access and error logs to /var/log
	access_log /var/log/intelligentgrouping_access.log;
	error_log /var/log/intelligentgrouping_error.log;

	location / {
		# forward application requests to the node server
		proxy_pass http://localhost:8080;
		proxy_redirect off;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	}
}
```

8. Restart the nginx server: `sudo service nginx reload`
9. Install and configure [certbot](https://certbot.eff.org/lets-encrypt/ubuntufocal-nginx)
10. Clone this repository from GitHub.
11. Inside of the directory for this repository install the node dependencies: `npm install`
15. Update the .env file:

```
DBPASS=!!!
CLIENT_SECRET=!!!
CLIENT_ID=!!!
PORT=8080
```

16. Update Google Cloud Platform is allow connections from new domain (intelligentgrouping.nnhsse.org)
17. Install Production Manager 2, which is used to keep the node server running and restart it when changes are pushed to master:

```
sudo npm install pm2 -g
sudo pm2 start index.js
```

18. Verify that the node server is running: `sudo pm2 list`
19. Configure pm2 to automatically run when the EC2 instance restarts: `sudo pm2 startup`
20. Add a crontab entry to pull from GitHub every 15 minutes: `crontab -e`

```
*/15 * * * * cd /home/ubuntu/Intelligent-Grouping-App && git pull
```

21. Restart the node server: `sudo pm2 restart index`