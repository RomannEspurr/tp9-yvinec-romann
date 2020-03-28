var express=require("express")
var pug=require("pug")
var app=express()
var validUsers=["aaaaa0000","aaaaa0001","aaaaa0002","aaaaa0003","aaaaa0004","aaaaa0005","aaaaa0006","aaaaa0007","aaaaa0008","aaaaa0009"]
var requestNB=new Array(10)
requestNB.fill(0)
var mois=["Janvier","Fevrier","Mars","Avril","Mai","Juin","Juillet","Aout","Semptembre","Octobre","Novembre","Decembre"]
const port =process.env.PORT || 5000
function init(lengthA,lengthB){
	res=Array(lengthB)
	for(i=0;i<lengthB;i++){ res[i]=Array(lengthA).fill(0) }
	for(i=0;i<lengthA;i++){ res[0][i]=i }
	for(i=0;i<lengthB;i++){ res[i][0]=i }
	return res
}

function distance(A,B){
	if((A.length==0) || (B.length==0)){
		return Math.max(A.length,B.length)
	}
	var tab=init(A.length+1,B.length+1)
	for(i=1;i<B.length+1;i++){
		for(j=1;j<A.length+1;j++){
			var letterDiff=((A[j-1]==B[i-1]) ? 0 : 1)
			tab[i][j]=Math.min(Math.min((tab[i][j-1])+1,(tab[i-1][j])+1),(tab[i-1][j-1])+letterDiff)
		}
	}
	return tab[B.length][A.length]
}

function validId(id){
	var valid=false
	validUsers.forEach(elem => {
		if(elem.localeCompare(id)==0){valid=true}
	})
	return valid
}

app.get("/",function(req,res){
	var linkRefresh = "//"+req.get("host")+"/refresh"
	var link="//"+req.get("host")
	compiledFunction=pug.compileFile("index.pug")
	res.send(compiledFunction({id:validUsers,nbRequest:requestNB,link:link,refreshLink:linkRefresh}))
})

app.get("/refresh",function(req,res){
	compiledFunction=pug.compileFile("refresh.pug")
	res.send(compiledFunction({id:validUsers,nbRequest:requestNB}))
})


app.get("/:id/distance/*",function(req,res){
	var date=new Date()
	
	var id=req.param("id")
	var A=req.param("stringA")
	A=req.query.A
	var B=req.param("stringB")
	B=req.query.B
	var erreur=""
	if(((typeof A)!="string")||((typeof B)!="string")){
		erreur="Requete mal formee"
		res.json({"identifiant":id,"erreur":erreur})
	}else{
		var regex=/\b([ACGT]+)\b/
		if((!A.match(regex))||(!B.match(regex))){
			erreur="Une des chaines ne code pas de l'ADN."	
		}
		if((A.length>50)||(B.length>50)){
			erreur="Une des 2 chaines est trop longue (gardez des chaines inferieurs a 50 caracteres))"
		}
		if(!validId(id)){
			erreur="Vous n'etes pas autorise a utiliser ce service."
		}
		if(validId(id)&&(requestNB[validUsers.indexOf(id)])>=5){
			erreur="Nombre de requete dépasse. Attendez une minute."
		}
		if(erreur.length!=0){
			res.json({"identifiant":id,"erreur":erreur})
		}else{
			var dist=distance(A,B)
			var date2=new Date()
			var day= date.getDate()+" "+mois[date.getMonth()]+" "+date.getFullYear()+" "+date.getHours()+":"+date.getMinutes()
			requestNB[validUsers.indexOf(id)]=requestNB[validUsers.indexOf(id)]+1
			res.json({"identifiant":id,"date":day,"A":A,"B":B,"distance":dist,"temps de calcul (en ms)":(date2.getMilliseconds()-date.getMilliseconds()),"interrogation minute":requestNB[validUsers.indexOf(id)]})
		}
	}
	
})

app.get("/:id/*",function(req,res){
	var id=req.param("id")
	res.json({"identifiant":id,"erreur":"la requete est mal formee"})
	res.send("non")
})

app.get("*",function(req,res){
	res.status(404)
})

app.param(":id",function(req,res,next,value){next()})

app.param(":string*",function(req,res,next,value){next()})

app.listen(port)
setInterval(function(){
	requestNB.fill(0)
},60000)

