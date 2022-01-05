//Hide notifications badge when clicked
$(document).ready(function(){
    $(".li-notifications").click(function(){
        $("span.icon-button-badge").hide();

        console.log("ICON HIDDEN")
    })
})

/*
//Side Notification Code
function showNotification(){
    const notification = new Notification("New message from dcode!", {
        body: "Notficatiohn example for Hermes Eye?"
    });

    
    notification.onclick = (e) =>{
    console.log("Here");
    window.location.href = "https://www.google.com";
    };

notification.onclick = function (event) {
    console.log('Notification clicked.');
} 
    
    
}

// default, granted, denied
console.log(Notification.permission);

if (Notification.permissionT=== "granted") {
    // alert("we have permission!");
    showNotification();
} else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
    // console.log(permission);
    if (permission === "granted"){
        showNotification();
    }
    });
}

*/
