function fadeOut(){
    TweenMax.to('.enter_button', 1, {
        opacity: 0
    });
    
    TweenMax.to(".screen", 2, {
        opacity: 0,
    });

    TweenMax.to(".overlay", 2, {
        opacity: "0"
    });


    TweenMax.to(".overlay", 4, {
        delay: 1.5,
        ease: Expo.easeInOut,
        visibility: "hidden"
    })

    
    TweenMax.to(".legend", 5, {
        delay: 1.5,
        ease: Expo.easeInOut,
        opacity: "90"
    })

}

function exp_redlining(){
     TweenMax.to(".exp_redlining", 1, {
         visibility: "visible",
     })

}

function oexp_redlining(){
    TweenMax.to(".exp_redlining", 1, {
        visibility: "hidden",
    });

}

function exp_map(){
    TweenMax.to(".exp_map", 1, {
        visibility: "visible",
    })

}

function oexp_map(){
   TweenMax.to(".exp_map", 1, {
       visibility: "hidden",
   });

}

const exit_panel_redlining = (e) => {
    console.log('button is clicked!');
};
