// Constants to easily refer to pages
const SPLASH = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");

var last_ind = 0;

let loggedInUser = {
    user_id: localStorage.getItem('id'),
    api_key: localStorage.getItem('api_key')
  };

let rooms = JSON.parse(localStorage.getItem('rooms'));

document.getElementsByClassName("failed")[0].style.display = "none";

// Custom validation on the password reset fields
const repeatPassword = document.querySelector(
  ".profile input[name=repeatPassword]"
);

const repeatPasswordMatches = () => {
  const p = document.querySelector(".profile input[name=password").value;
  const r = repeatPassword.value;
  return p == r;
};

repeatPassword.addEventListener("input", (event) => {
  if (repeatPasswordMatches()) {
    repeatPassword.setCustomValidity("");
  } else {
    repeatPassword.setCustomValidity("Password doesn't match");
  }
});

const showOnly = (element) => {
  console.debug("showOnly");
  SPLASH.style.display = "none";
  PROFILE.style.display = "none";
  LOGIN.style.display = "none";
  ROOM.style.display = "none";
  element.style.display = "block";
};

async function get_room_name() {
    const request = await fetch("/api/roomname", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "room_id": window.location.pathname.split("/").pop(),
        },
    })

    const result = await request.json();

    let room_id = window.location.pathname.split("/").pop();
    let room_name = result['name'];

    document.getElementsByClassName("displayRoomName")[0].innerHTML = '<h3> Chatting in <strong>' + room_name + '</strong><a><span class="material-symbols-outlined md-18">edit</span></a></h3>';
    document.getElementById("invite").innerHTML = '/rooms/' + room_id;

}

const router = () => {
  const path = window.location.pathname;
  console.log(`routing to "${path}"...`);

   if (!loggedInUser.user_id) {
     if (path == "/login" || path == "/") {
        console.log("Not saving to cache...");
     }
     else {
        localStorage.setItem("cache_path", path);
     }
   }

   console.log("The cache path is: " + localStorage.getItem("cache_path"));

  switch (true) {
    case path == "/":

      get_rooms();
      document.getElementsByClassName("roomList")[0].innerHTML = "";

      if (loggedInUser.user_id) {
        document.getElementsByClassName("username")[0].innerHTML= "Welcome back, " + localStorage.getItem('username');
        document.getElementsByClassName("loggedIn")[0].style.display = "block";
        document.getElementsByClassName("loggedOut")[0].style.display = "none";
        document.getElementsByClassName("create")[0].style.display = "block";
        document.getElementsByClassName("signup")[0].style.display = "none";

        if (rooms === null) {
            document.getElementsByClassName("noRooms")[0].style.display = "none";
            document.getElementsByClassName("roomList")[0].style.display = "none";
          }
          else {
            for (const room of rooms) {
                document.getElementsByClassName("noRooms")[0].style.display = "none";
                document.getElementsByClassName("roomList")[0].innerHTML+='<a id=' + room['id'] + '>' + room['id'] + ': <strong>' + room['name'] + '</strong></a>'
            }
          }
      }
      else {
        document.getElementsByClassName("loggedOut")[0].style.display = "block";
        document.getElementsByClassName("loggedIn")[0].style.display = "none";
        document.getElementsByClassName("create")[0].style.display = "none";
        document.getElementsByClassName("signup")[0].style.display = "block";
      }

      showOnly(SPLASH);
      break;

    case path == "/login":
      if (loggedInUser.user_id) {
        history.pushState({}, "Main Page", "/")
        router()
        break;
      }
      else {
        showOnly(LOGIN);
        break;
      }

    case path == "/profile":
        localStorage.setItem("login_failed", false);

        if (loggedInUser.user_id) {
          document.getElementsByClassName("username")[1].innerHTML= localStorage.getItem('username');
          let inp = document.getElementById("changepass");
          inp.value = "";

          let inp2 = document.getElementById("changepass2");
          inp2.value = "";

          let inp3 = document.getElementById("changeuser");
          inp3.value = "";
        }
        else {
            history.pushState({}, "Login Page", "/login");
            window.location.reload();
        }

        showOnly(PROFILE);
        break;


    case path == "/room":
        history.pushState({}, "Main Page", "/")
        router()
        break;

    case /room\/\d+/.test(path):

        get_room_name();

        if (loggedInUser.user_id) {
            document.getElementsByClassName("username")[2].innerHTML = localStorage.getItem('username');
            
            startMessagePolling();
        }
        else {
            history.pushState({}, "Login Page", "/login");
            window.location.reload();
          }

        showOnly(ROOM);
        break;
    default:
        console.log("no match");
  }
};


// TODO:  On page load, read the path and whether the user has valid credentials:
//        - If they ask for the splash page ("/"), display it
//        - If they ask for the login page ("/login") and don't have credentials, display it
//        - If they ask for the login page ("/login") and have credentials, send them to "/"
//        - If they ask for any other valid page ("/profile" or "/room") and do have credentials,
//          show it to them
//        - If they ask for any other valid page ("/profile" or "/room") and don't have
//          credentials, send them to "/login", but remember where they were trying to go. If they
//          login successfully, send them to their original destination
//        - Hide all other pages

// TODO:  When displaying a page, update the DOM to show the appropriate content for any element
//        that currently contains a {{ }} placeholder. You do not have to parse variable names out
//        of the curly  braces—they are for illustration only. You can just replace the contents
//        of the parent element (and in fact can remove the {{}} from index.html if you want).

// TODO:  Handle clicks on the UI elements.
//        - Send API requests with fetch where appropriate.
//        - Parse the results and update the page.
//        - When the user goes to a new "page" ("/", "/login", "/profile", or "/room"), push it to
//          History

// TODO:  When a user enters a room, start a process that queries for new chat messages every 0.1
//        seconds. When the user leaves the room, cancel that process.
//        (Hint: https://developer.mozilla.org/en-US/docs/Web/API/setInterval#return_value)

// On page load, show the appropriate page and hide the others
router();

const login_button = document.getElementById('login_but');
login_button.addEventListener("click", 
    function (event) {
        history.pushState({}, "Login Page", "/login");
        window.location.reload();
    })


const profile_button = document.getElementById('profile_banner');
profile_button.addEventListener("click", 
    function (event) {
        history.pushState({}, "Profile", "/profile");
        router();
    })

const profile_button2 = document.getElementById('room_banner');
profile_button2.addEventListener("click", 
    function (event) {
        history.pushState({}, "Profile", "/profile");
        router();
    })


const cool_button = document.getElementsByClassName('exit goToSplash')[0];
cool_button.addEventListener("click", 
    function (event) {
        history.pushState({}, "Main Page", "/");
        window.location.reload();
        //router();
    })

clicked_rooms = document.querySelectorAll('.roomList a');
clicked_rooms.forEach(clicked => {
    clicked.addEventListener('click', function(event) {
      const id = this.id;
      history.pushState({}, "Room " + id, "/room/" + id);
      router();
    });
});

const edit_room_but = document.getElementsByClassName('material-symbols-outlined md-18')[0];
edit_room_but.addEventListener("click", 
    function (event) {
        console.log("Clicking edit...")
        document.getElementsByClassName("editRoomName")[0].style.display = "block";
        document.getElementsByClassName("displayRoomName")[0].style.display = "none";
        router();
    })

const header_button = document.getElementById('headline');
header_button.addEventListener("click", 
    function (event) {
        history.pushState({}, "Main Page", "/");
        router();
    })

const header_button2 = document.getElementById('headline2');
header_button2.addEventListener("click", 
    function (event) {
        history.pushState({}, "Main Page", "/");
        router();
    })
    
const header_button3 = document.getElementById('headline3');
header_button3.addEventListener("click", 
    function (event) {
        history.pushState({}, "Main Page", "/");
        router();
    })

const header_button4 = document.getElementById('headline4');
header_button4.addEventListener("click", 
    function (event) {
        history.pushState({}, "Main Page", "/");
        router();
    })

const header_button5 = document.getElementById('headline5');
header_button5.addEventListener("click", 
    function (event) {
        history.pushState({}, "Main Page", "/");
        router();
    })

const header_button6 = document.getElementById('headline6');
header_button6.addEventListener("click", 
    function (event) {
        history.pushState({}, "Main Page", "/");
        router();
    })

async function logout() {
    localStorage.clear();
    history.pushState({}, "Main Page", "/");
    window.location.reload();
}


// POST to the API when the user posts a new message.
async function login() {
  
    //history.pushState({}, "Login Page", "/login");

    let form = document.forms[0];
    let username = form.elements['username'];
    let pass = form.elements['password'];
  
    form.addEventListener("submit", function(event) {
      event.preventDefault();
    });
    
    console.log("The username is: " + username.value);
    console.log("The password is: " + pass.value);

    try {
      const request = await fetch("/api/login", {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify({ "user": username.value, "pass": pass.value})
      })
  
      const result = await request.json();
      console.log("Success:", result);

      if (result['Success']) {
        localStorage.setItem("username", result['name']);
        localStorage.setItem("id", result['id']);
        localStorage.setItem("api_key", result['api_key']);

        if (localStorage.getItem("cache_path") == null){
            history.pushState({}, "Main Page", "/");
            window.location.reload();
         }
        else {
            console.log("Pushing new cache...");
            history.pushState({}, "", localStorage.getItem("cache_path"));
            window.location.reload();
            //router();
        }

        document.getElementsByClassName("failed")[0].style.display = "none";
        
      }
      else {
        document.getElementsByClassName("failed")[0].style.display = "block";
        username.value = "";
        pass.value = "";
        router();
      }
  
    } catch (error) {
      console.error("Error:", error);
    }
}
  

async function get_rooms() {
    try {
      const request = await fetch("/api/rooms", {
          method: "GET",
          headers: {
              "Content-Type": "application/json"
          }
      })
  
      const result = await request.json();

      localStorage.setItem("rooms", JSON.stringify(result['rooms']));

    } catch (error) {
        console.error("Error:", error);
    }
}


async function create_room() {
    try {
        const request = await fetch("/api/createrooms", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "api_key": loggedInUser.api_key
            }
        })
    
        const result = await request.json();

        history.pushState({}, "Room" + result['room_id'], "/room/" + result['room_id']);
        router();
  
      } catch (error) {
          console.error("Error:", error);
      }
}


async function signup() {  
    try {
      const request = await fetch("/api/signup", {
          method: "GET",
          headers: {
              "Content-Type": "application/json"
          }
      })
  
      console.log(request);
  
      const result = await request.json();
      console.log("Success:", result);

      localStorage.setItem("username", result['name']);
      localStorage.setItem("id", result['id']);
      localStorage.setItem("api_key", result['api_key']);

      //history.pushState({}, "Main Page", "/");

      get_rooms();
      window.location.reload();
  
    } catch (error) {
      console.error("Error:", error);
    }
}


// POST to the API when the user posts a new message.
async function postMessage() {
    user_id = loggedInUser.user_id;
    api_key = loggedInUser.api_key;
    curr_room = window.location.pathname.split("/").pop();
  
    let form = document.getElementById("postcomment");
    let message = form.value;

    console.log("The message is: " + message);
  
    try {
      const request = await fetch("/api/messages", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "API_Key": api_key
          },
          body: JSON.stringify({ "message": message, "user": user_id, "room": curr_room})
      })

  
      const result = await request.json();
      console.log("Success:", result);
  
      form.value = "";
  
      return result;
  
    } catch (error) {
      console.error("Error:", error);
    }
  }
  

// Fetch the list of existing chat messages.
async function getMessages() {
    user_id = loggedInUser.user_id;
    api_key = loggedInUser.api_key;
    curr_room = window.location.pathname.split("/").pop();

    var chat = document.querySelector('.messages');

    try {
        const request = await fetch("/api/messages", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "API_Key": api_key,
                "user": user_id, 
                "room": curr_room,
                "ind": last_ind
            },
        })

        const result = await request.json();
        let flag = result.flag;
        let messages = result.messages;

        if (flag == true) {
            messages.forEach((message)=>{
                const messageElement = document.createElement('message');
                const authorElement = document.createElement('author');
                const contentElement = document.createElement('content');

                authorElement.textContent = message.name;
                contentElement.textContent = message.body;

                messageElement.appendChild(authorElement);
                messageElement.appendChild(contentElement);

                chat.appendChild(messageElement);

                last_ind = message.id;
            })
            last_ind++;
        }
    
    } catch (error) {
        console.error("Error:", error);
        }
}
  
  
  // Automatically poll for new messages on a regular interval.
function startMessagePolling() {
    setInterval(getMessages, 500)
    return;
}
  
  
async function change_room() {
    user_id = loggedInUser.user_id;
    api_key = loggedInUser.api_key;
    curr_room = window.location.pathname.split("/").pop();
  
    let inp = document.getElementById("new_room_name");
    let new_name = inp.value;
      
    console.log("The new room name is: " + new_name);
  
    try {
      const request = await fetch("/api/roomname", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "API_Key": api_key
          },
          body: JSON.stringify({ "name": new_name, "user": user_id, "room": curr_room})
      })
  
      const result = await request.json();
      console.log("Success:", result);
  
      inp.value = "";
  
      router(); 
  
    } catch (error) {
      console.error("Error:", error);
    }
}
  
  
async function change_user() {
    user_id = loggedInUser.user_id;
    api_key = loggedInUser.api_key;
    
    let inp = document.getElementById("changeuser");
    let new_name = inp.value;

    console.log("The new username is: " + new_name);
  
    try {
      const request = await fetch("/api/username", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "API_Key": api_key
          },
          body: JSON.stringify({ "name": new_name, "user": user_id})
      })
  
      const result = await request.json();
      console.log("Success:", result);
  
      inp.value = "";
      localStorage.setItem('username', new_name);
      router();
  
    } catch (error) {
      console.error("Error:", error);
    }
}
  
  
async function change_pass() {
    user_id = loggedInUser.user_id;
    api_key = loggedInUser.api_key;
    
    let inp = document.getElementById("changepass");
    let new_pass = inp.value;

    let inp2 = document.getElementById("changepass2");
    let repeat_pass = inp2.value;
  
    
    console.log("The new password is: " + new_pass);
    console.log("The repeat password is: " + repeat_pass);
  
    if (new_pass == repeat_pass) {
        try {
        const request = await fetch("/api/password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "API_Key": api_key
            },
            body: JSON.stringify({ "pass": new_pass, "user": user_id})
        })
    
        const result = await request.json();
        console.log("Success:", result);
    
        inp.value = "";
        inp2.value = "";
    
        router();
    
        } catch (error) {
        console.error("Error:", error);
        }
    }
    else {
        router();
    }
}

window.addEventListener('popstate', function(event) {
    if (event.state === 'back') {
      history.back();
      location.reload();
    } else if (event.state === 'forward') {
      history.forward();
      location.reload();
    }
  });
