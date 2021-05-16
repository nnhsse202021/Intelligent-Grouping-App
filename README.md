# Intelligent-Grouping-App
![Intelligent Grouping Logo](/static/images/blue-bg.svg)
## Overview:
The Intelligent Grouping web application is a website designed to provide teachers with the tools to group their students together for various classroom purposes, with a high degree of customizability and ease-of-use.
## Features:
* Easy Google authentication for sign in.
* Import class rosters through a .CSV file upload (follows Infinite Campus' format).
* Manually create class rosters through an input system.
* Generate random groupings of a specified number of groups or group size.
* Exclude users from a group in case of absence or other purposes (like TAs)
* Input user preferences through automatically generated forms
## Instructions:
* After the website finishes loading, simply press the "Sign in with Google" button and sign in using whatever email you wish, keeping in mind that that email is your account for this website.
  * Currently only naperville203.org organization emails are permitted
* To add classes, simply click the "Add Class" button in the bottom left of the screen.
  * For manual entry, click the manual entry button in the popup and input your students one by one. Afterward, click "save" to save the completed manual class.
  * For automatic fill in with a .CSV file, click "Import Class Roster" on the popup and select the desired CSV file from Infinite Campus to add your classes. This works with CSV files exported form infinite campus. 
  * To edit classes, select a class from the sidebar and then click the pencil icon, and the manual entry form will pop up, allowing you to change values.
  * To delete classes, select a class from the sidebar and then click the trash can icon.
* Instructions for basic random groups.
  * Click the desired class in the sidebar.
  * In the panel, select "Create grouping".
    * In case somebody is absent or otherwise not supposed to be put into a group, like for example if they are a teacher's assistant, click their name on the right sidebar, and then click the red outlined section of that sidebar. This will place them within the exclusion category and exclude them from groupings. Doing the reverse will reverse this exclusion.
  * Click the large plus button in the main canvas to add a grouping.
  * Click the "Arrange Students" button.
  * Select "Random Grouping".
  * Input the desired parameters (amount of groups made or people per group).
  * Submit your response.
* Instructions for setting up preferences and sending out forms
  * Click on the desired class in the sidebar.
  * On the rightmost panel, click "Add Choice."
    * For each choice setting you add, there will be more items added to the automatically generated forms that you can send to your students.
  * Select a choice of grouping type.
    * Preferred students allows students to choose who they wish to be paired up with
    * Unpreferred students allows students to choose who they think they cannot work well with easily
    * Preferred topic is applicable when each group will be covering a different topic, and allows them to choose what they would rather learn/talk about.
    * Unpreferred topic is the same as preferred topic but for topics they do not want to learn about.
  * Input a description for the context for which these preferences are being asked for (in case of people wanting to work with others in certain contexts, or different events requiring different sets of topics), followed by the number of choices the student can make (ranking people).
    * For topic preferences, there are additional steps in the form of adding the name of the topics in question. To set up choices for topics, type in the names for each followed by a new line.
  * After entering all necessary information, click "add choice" and a new option should pop up on the preferences panel on the class screen.
  * If necessary, pressing the x button can remove a preference choice.
  * To send out forms, simply click "copy form link" at the bottom right and then paste the link to somewhere where anyone can access and click it.
* Instructions for students to fill out the forms
  * Enter your student ID into the Student ID field on the form.
  * Use the dropdown menus to rank other students and topics in the order in which you would rather not or would rather have as a part of your group.
  * Submit the form.