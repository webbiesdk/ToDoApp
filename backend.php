<?php
// Mini docs. 
/*
Home made error codes: 
1 == no errors. 
2 == username already exits. 
3 == wrong username or password
*/

// Connect to the server, no problem. 
$hostname = "host";
$username = "username";
$password = "pass";
$dabebase = "DB";
mysql_connect($hostname, $username, $password) or die(mysql_error());
mysql_select_db($dabebase) or die(mysql_error());
mysql_query("CREATE TABLE IF NOT EXISTS notes_users(
    id INT AUTO_INCREMENT,
    username TEXT,
    password TEXT,	
	guid INT,
    PRIMARY KEY(id)
)") OR DIE(mysql_error());
mysql_query("CREATE TABLE IF NOT EXISTS notes_notes(
    id INT AUTO_INCREMENT,
    username TEXT,
    guid TEXT,
	note TEXT,
    PRIMARY KEY(id)
)") OR DIE(mysql_error());
mysql_query("CREATE TABLE IF NOT EXISTS notes_session(
    id INT AUTO_INCREMENT,
    username TEXT,
    sid TEXT,
	userAgent TEXT,
    PRIMARY KEY(id)
)") OR DIE(mysql_error());

include 'functions.php';


require('pusher.php');
// First i handle the case, where we create a new user. 
if ( $_POST["createUser"] )
{
	$user = $_POST["createUser"];
	$user = mysql_real_escape_string(stripslashes($user));
	$user = mysql_real_escape_string($user);
	$remember = $_POST['remember']; // remember either == "true" or something else. 
	// First i check if someone already used that name.
	$result = mysql_query("SELECT * FROM notes_users WHERE username='$user'") OR DIE(mysql_error());
	// Mysql_num_row is counting table row
	$count=mysql_num_rows($result);
	// There cant be any. 
	if($count==0){
		// We continue
		$password = $_POST["password"];
		$password = stripslashes($password);
		$password = mysql_real_escape_string($password);
		$password = sha1($password);
		mysql_query("INSERT INTO notes_users (username, password, guid) VALUES ('$user', '$password', '0')") OR DIE(mysql_error());
		
		// Then we need to log in. 
		login($user, $remember);
		echo '1';// 1 == no errors. 
	}
	else {
		echo "2";// 2 == username already exits. 
	}
}
// If the user tries to log in. 
if ( $_POST["login"] )
{
	// username and password sent from form 
	$user=$_POST['login']; 
	$password = $_POST['password'];
	$password = sha1($password);
	$remember = $_POST['remember'];
	
	// To protect MySQL injection (more detail about MySQL injection)
	$user = stripslashes($user);
	$user = mysql_real_escape_string($user);
	
	$result =  mysql_query("SELECT password FROM notes_users WHERE username='$user'") OR DIE(mysql_error());
	while($row = mysql_fetch_assoc($result)) //Lav en while der kører alle rækker igennem
	{
		$MySQLPassWord = $row['password'];
	}
	
	// Mysql_num_row is counting table row
	$count = mysql_num_rows($result);
	// If result matched $user and $password, table row must be 1 row
	
	if($count == 1){
		if ($password == $MySQLPassWord)
		{
			// Remeber it. 
			if (login($user, $remember))
			{
				echo '1';// 1 == no errors. '
			}
			else
			{
				echo '7'; // Plain unkown error, this shouldn't happen. 
			}
		}
		else {
			echo '3';// 3 == wrong username or password. 
		}
	}
	else {
		echo '3';// 3 == wrong username or password. 
	}
}
// I just ask. 
if ( $_POST["Checklogin"] )
{
	$user = loginCheck();
	if ($user)
	{
		echo $user;	
	}
	else
	{
		echo '3';
	}
}
if ($_POST["newNote"])
{
	$user = loginCheck();
	if ($user)
	{
		$query = mysql_query("SELECT guid FROM notes_users WHERE username = '$user'") OR DIE(mysql_error());
		while($row = mysql_fetch_assoc($query)) //Lav en while der kører alle rækker igennem
		{
			$guid = $row['guid'] + 1;
			echo '1' . $guid;
		}
		mysql_query("UPDATE notes_users SET guid = '$guid' WHERE username = '$user'") OR DIE(mysql_error());
		
		// Now comes the good part. Actually inserting the new note. 
		mysql_query("INSERT INTO notes_notes (username, guid, note) VALUES ('$user', '$guid', '')") OR DIE(mysql_error());
	}
	else
	{
		echo '3';	
	}
}
if ( $_POST["logout"] )
{
	// Simple, effective. 
	$ID = $_COOKIE['ToDoSID'];
	mysql_query("DELETE FROM notes_session WHERE sid='$ID'");
	$pastdate = mktime(0,0,0,1,1,1970);
	setcookie("ToDoSID","",$pastdate, '/', 'webbies.dk');
	echo '1';// 1 == no errors. 
}
//mysql_query("INSERT INTO notes_users (content, deleted) VALUES ('Anders', 1)") OR DIE(mysql_error());
if ( $_POST["save"] )
{
	$user = loginCheck();
	$id = $_POST["save"];
	$content =  $_POST["content"];
	$content = str_replace("\\", "", $content);
	$content = mysql_real_escape_string(stripslashes($content));
	if ($user)
	{
		mysql_query("UPDATE notes_notes SET note = '$content' WHERE guid = '$id' AND username = '$user'") OR DIE(mysql_error());
		echo '1';
		$data[$id] = $_POST["content"];
		$data = json_encode($data);
		pusher_sync($data);
	}
	else
	{
		echo '3';	
	}
	
}
if ( $_POST["deleteNote"] )
{
	$user = loginCheck();
	$id = $_POST["deleteNote"];
	$content =  $_POST["content"];
	if ($user)
	{
		mysql_query("DELETE FROM notes_notes WHERE guid = '$id' AND username = '$user'") OR DIE(mysql_error());
		echo '1';
		$data['delete'] = $id;
		$data = json_encode($data);
		pusher_sync($data);
	}
	else
	{
		echo '3';	
	}
}
if ( $_POST["get"] )
{
	$user = loginCheck();
	if ($user)
	{
		$query = mysql_query("SELECT * FROM notes_notes WHERE username = '$user'") OR DIE(mysql_error());
		$data = array();
		while($row = mysql_fetch_assoc($query)) //Lav en while der kører alle rækker igennem
		{
			$data[$row['guid']] = $row['note'];
		}
		echo json_encode($data);
	}
	else
	{
		echo '3';	
	}
}

?>