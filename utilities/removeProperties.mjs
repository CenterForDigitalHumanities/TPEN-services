export const removeProperties = (userObject, ...propertiesToRemove)=>{
 if(!userObject) return
 const { ...publicUser } = userObject;
 for (const property of propertiesToRemove) {
     delete publicUser[property];
   }
   // publicUser.links = profile?.links //Assuming something in the profile object is public. NB profile has to be sourced from the destructure on line 3
 return publicUser
} 