# Test Stories

<table>
	<tr>
		<th>1</th>
		<th>Application opening the first time</th>
	</tr>
		<tr>
		<td>Actor</td>
		<td>User</td>
	</tr>
	<tr>
		<td>Prerequisite</td>
		<td>The application was never opened before</td>
	</tr>
	<tr>
		<td>Result on fail</td>
		<td>When there's no internet access: 404 error</td>
	</tr>
	<tr>
		<td>Result on success</td>
		<td>The application opens, greets the user with a default, empty project</td>
	</tr>
	<tr>
		<td>Effect of</td>
		<td>The user opens the application in the browser</td>
	</tr>
	<tr>
		<td>Events</td>
		<td>
			<ol>
				<li>The user opens the application</li>
				<li>The application loads</li>
			</ol>
		</td>
	</tr>
	<tr>
		<td>Notes</td>
		<td></td>
	</tr>
</table>

---

<table>
	<tr>
		<th>2</th>
		<th>Application opening consecutively</th>
	</tr>
		<tr>
		<td>Actor</td>
		<td>User</td>
	</tr>
	<tr>
		<td>Prerequisite</td>
		<td>The application has been opened before</td>
	</tr>
	<tr>
		<td>Result on fail</td>
		<td>When there's no internet access: 200, app loads from cache</td>
	</tr>
	<tr>
		<td>Result on success</td>
		<td>The application opens, greets the user with his latest project loaded from cache</td>
	</tr>
	<tr>
		<td>Effect of</td>
		<td>The user opens the application in the browser</td>
	</tr>
	<tr>
		<td>Events</td>
		<td>
			<ol>
				<li>The user opens the application</li>
				<li>The application loads regardless of internet connection, from cache</li>
				<li>The users data is intact</li>
			</ol>
		</td>
	</tr>
	<tr>
		<td>Notes</td>
		<td>This is a PWA feature</td>
	</tr>
</table>

---

<table>
	<tr>
		<th>3</th>
		<th>Creating a new character</th>
	</tr>
		<tr>
		<td>Actor</td>
		<td>User</td>
	</tr>
	<tr>
		<td>Prerequisite</td>
		<td>A project is open</td>
	</tr>
	<tr>
		<td>Result on fail</td>
		<td>Error messages shown</td>
	</tr>
	<tr>
		<td>Result on success</td>
		<td>A character gets saved and remains on the globe</td>
	</tr>
	<tr>
		<td>Effect of</td>
		<td>The user clicked on the globe and selected 'New Character' from the context menu</td>
	</tr>
	<tr>
		<td>Events</td>
		<td>
			<ol>
				<li>The user clicks on the globe, a transparent character icon appears</li>
				<li>A popup shows with the option 'New Character'</li>
				<li>The user clicks on it, the popup transforms into a basic form, with a name field</li>
				<li>After typing in a name and sending the form, the character icon get opaque</li>
			</ol>
		</td>
	</tr>
	<tr>
		<td>Notes</td>
		<td>This is also available from the timeline</td>
	</tr>
</table>

---

<table>
	<tr>
		<th>4</th>
		<th>Editing a character</th>
	</tr>
		<tr>
		<td>Actor</td>
		<td>User</td>
	</tr>
	<tr>
		<td>Prerequisite</td>
		<td>A project is open, a character is on the scene</td>
	</tr>
	<tr>
		<td>Result on fail</td>
		<td>Error messages shown</td>
	</tr>
	<tr>
		<td>Result on success</td>
		<td>The characters changes gets saved</td>
	</tr>
	<tr>
		<td>Effect of</td>
		<td>The user clicked on a character on the globe, or on the timeline</td>
	</tr>
	<tr>
		<td>Events</td>
		<td>
			<ol>
				<li>The user clicks on a characters icon, or its block in the timeline</li>
				<li>A popup shows with the properties of said character</li>
				<li>The user click on 'Save and change all'</li>
				<li>The characters base properties changed</li>
			</ol>
		</td>
	</tr>
	<tr>
		<td>Notes</td>
		<td>Any property of a character can change at any given point on the timeline, and that change will be seen only from that point. Using this method will instead change the base data of the character. Same as changing the data at the point where it was introduced.</td>
	</tr>
</table>

---

<table>
	<tr>
		<th>5</th>
		<th>Making a change to a character</th>
	</tr>
		<tr>
		<td>Actor</td>
		<td>User</td>
	</tr>
	<tr>
		<td>Prerequisite</td>
		<td>A project is open, a character is on the scene</td>
	</tr>
	<tr>
		<td>Result on fail</td>
		<td>Error messages shown</td>
	</tr>
	<tr>
		<td>Result on success</td>
		<td>The characters changes gets saved from the time that was selected on the timeline</td>
	</tr>
	<tr>
		<td>Effect of</td>
		<td>The user clicked on a character on the globe, or on the timeline</td>
	</tr>
	<tr>
		<td>Events</td>
		<td>
			<ol>
				<li>The user clicks on a characters icon, or its block in the timeline</li>
				<li>A popup shows with the properties of said character</li>
				<li>The user click on the highlighted 'Save' button</li>
				<li>The characters properties changed from that point of time</li>
			</ol>
		</td>
	</tr>
	<tr>
		<td>Notes</td>
		<td>Any property of a character can change at any given point on the timeline, and that change will be seen only from that point. Using this method will change the data of the character. Inspecting the character at a time after the change has made will show the new properties. Inspecting it before, will still show the previous values.</td>
	</tr>
</table>

<table>
	<tr>
		<th>6</th>
		<th>Making a path</th>
	</tr>
		<tr>
		<td>Actor</td>
		<td>User</td>
	</tr>
	<tr>
		<td>Prerequisite</td>
		<td>A project is open</td>
	</tr>
	<tr>
		<td>Result on fail</td>
		<td>Error messages shown</td>
	</tr>
	<tr>
		<td>Result on success</td>
		<td>A new segment of a path will be created</td>
	</tr>
	<tr>
		<td>Effect of</td>
		<td>The user clicked on the globe, and selected the 'New Path' option</td>
	</tr>
	<tr>
		<td>Events</td>
		<td>
			<ol>
				<li>The user clicks on the globe, selects the 'New Path' option</li>
				<li>A line appears on the globe with two handlers on each end</li>
				<li>The user drags and drops the handlers to their final positions</li>
				<li>The last clicked handler have a '+' widget above it. Dragging that will create a new node from that node.</li>
				<li>The user clicks somewhere else</li>
			</ol>
		</td>
	</tr>
	<tr>
		<td>Notes</td>
		<td>This path editing sequence can be started and ended anytime. If there is a route associated with this path, on each change it wont recaulculate it (as its likely that the user wants to keep that route. If not, the user can change by remaking the route. If the user tries to delete a node that has been used as point in a route, an error will be thrown.</td>
	</tr>
</table>

---

<table>
	<tr>
		<th>7</th>
		<th>Making a route</th>
	</tr>
		<tr>
		<td>Actor</td>
		<td>User</td>
	</tr>
	<tr>
		<td>Prerequisite</td>
		<td>A project is open, a path and a character is already made</td>
	</tr>
	<tr>
		<td>Result on fail</td>
		<td>Error messages shown</td>
	</tr>
	<tr>
		<td>Result on success</td>
		<td>The character will get a new position on an existing path at a later time, and it's position gets interpolated based on the path.</td>
	</tr>
	<tr>
		<td>Effect of</td>
		<td>The user selected a time on which the character should arrive, and then dragged the characters icon to the new position.</td>
	</tr>
	<tr>
		<td>Events</td>
		<td>
			<ol>
				<li>The user pans to a time on the timeline on which the characters should arrive</li>
				<li>The user drags the character to it's new position</li>
				<li>While dragging the planned route will be highlighted continously</li>
			</ol>
		</td>
	</tr>
	<tr>
		<td>Notes</td>
		<td>This route editing sequence can be started and ended anytime</td>
	</tr>
</table>

---

<table>
	<tr>
		<th>8</th>
		<th>Panning the cursor on the timeline</th>
	</tr>
		<tr>
		<td>Actor</td>
		<td>User</td>
	</tr>
	<tr>
		<td>Prerequisite</td>
		<td>A project is open, not necessary but to see the changes, at least a character is on the scene with a route</td>
	</tr>
	<tr>
		<td>Result on fail</td>
		<td>Pans back to where it started</td>
	</tr>
	<tr>
		<td>Result on success</td>
		<td>The new moments state will be shown on the globe</td>
	</tr>
	<tr>
		<td>Effect of</td>
		<td>The user gragged the time-cursor on the timeline</td>
	</tr>
	<tr>
		<td>Events</td>
		<td>
			<ol>
				<li>The user starts dragging the time-cursor on the timeline</li>
				<li>The user sees all the interpolated movement on the globe while panning</li>
				<li>On release the corsor stays where it was released</li>
			</ol>
		</td>
	</tr>
	<tr>
		<td>Notes</td>
		<td></td>
	</tr>
</table>
