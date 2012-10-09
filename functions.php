<?php 
// Replace with 
function pusher_sync($data)
{
	$app_id = 'your data here';
	$key = 'your data here';
	$secret = 'your data here';
	//$pusher = new Pusher($key, $secret, $app_id);
	//$pusher->trigger(loginCheck(), 'TODO', $data);	
}


function login($user, $remember){ 
	// All the autentication has happened, now we just need to make the session. 
	$ID = genRandomString() . uniqid('');
	if ($remember == 'true')
	{
		// 10 years should be enough. 
		$time = time()+60*60*24*365*10;
	}
	else
	{
		$time = 0;
	}
	setcookie('ToDoSID', $ID, $time, '/', 'webbies.dk');
	$userAgent = $_SERVER['HTTP_USER_AGENT'];
	mysql_query("INSERT INTO notes_session (username, sid , userAgent) VALUES ('$user', '$ID', '$userAgent')") OR DIE(mysql_error());
	return true;
} 

function genRandomString() {
    $length = 10;
    $characters = '0123456789abcdefghijklmnopqrstuvwxyz';
    $string = '';    
    for ($p = 0; $p < $length; $p++) {
        $string .= $characters[mt_rand(0, strlen($characters))];
    }
    return $string;
}

function loginCheck(){ 
	$ID = $_COOKIE['ToDoSID'];
	$userAgent = $_SERVER['HTTP_USER_AGENT'];
	$result =  mysql_query("SELECT * FROM notes_session WHERE sid='$ID'") OR DIE(mysql_error());
	while($row = mysql_fetch_assoc($result)) //Lav en while der kører alle rækker igennem
	{
		$user = $row['username'];
		$userAgent = $row['userAgent'];
	}
	if ($user)
	{
		return $user;
		// Got tired of this after to many browser updates. 
		// If i uncomment it, it still works. 
		/*
		if ($userAgent == $_SERVER['HTTP_USER_AGENT'])
		{
			return $user;
		}
		else
		{
			// Might be hacking attempt, deleting session. 
			// Few hackers / script kiddies think about this, so it works. 
			mysql_query("DELETE FROM notes_session WHERE sid='$ID'");
			return false;
		}*/
	}
	else
	{
		// No log in. 	
		return false;
	}
} 

?>