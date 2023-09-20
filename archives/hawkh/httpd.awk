#!/usr/bin/awk -f

BEGIN {
	document_root="/home/web-data";
	users_webdir="web-data";
	mimetypes["\.[sp]?html?$"]="text/html";
	mimetypes["\.txt$"]="text/html";
	mimetypes["\.jpe?g$"]="image/jpeg";
	mimetypes["\.gif$"]="image/gif";
	mimetype_default="application/octet-stream";
	startfile["index.htm"];
	startfile["index.html"];
	startfile["index.shtml"];
	startfile["index.phtml"];
	startfile["index.sh"];
	startfile["index.awk"];

	url="";
	head=0;
}

function header() {
	printf("HTTP/1.1 200 OK\n");
	print strftime("Date: %a, %d %b %Y %H:%M:%S %z");
	printf("Server: Hawkh/0.0.1 (Unix)\n");
	printf("Connection: close\n");
}

function httperr(kod,text) {
	print "HTTP/1.1 " kod " " text ;
	print strftime("Date: %a, %d %b %Y %H:%M:%S %z");
	printf("Server: Hawkh/0.0.1 (Unix)\n");
	printf("Connection: close\n\n");
}

function get_mimetype( file ) {
	for( t in mimetypes ) {
		if( match(file,t) )
			return mimetypes[t];
	}
	return mimetype_default;
}

function user_from_uri( uri ) {
	if( uri ~ /^~[^?]*\// )
		return( substr(uri,2,index(uri,"/")-2) );
	if( uri ~ /^~/ )
		return( substr(uri,2) );
	return( "" );
}

function file_from_uri( uri ) {
	if( uri ~ /^~[^?]*\// )
		return( substr(uri,index(uri,"/")+1) );
	if( uri ~ /^~/ )
		return( "" );
	return( uri );
}

function get_user_home( user ) {
	m= "^" user ":";
	while( (getline buf < "/etc/passwd")>0 ) {
		if( match(buf,m) )
		{	close("/etc/passwd");
			sub(/^[^:]*:[^:]*:[^:]*:[^:]*:[^:]*:/,"",buf);
			sub(/:.*$/,"",buf);
			return buf;
		}
	}
	close("/etc/passwd");
	return document_root;
}


#{	print >>"/tmp/httpd.debug";
#	fflush("/tmp/httpd.debug");
#}

url == "" {
	method=$1;
	url=$2;
	protocol=$3;
	if( method != "GET" || protocol !~ /^HTTP\/[0-9].[0-9]/ )
	{	httperr(401,"Error " protocol " (" $0 ")");
#		print "HTTP/1.1 401 Error " protocol " (" $0 ")";
#print "method=<" method "> url=<" url "> protocol=<" protocol ">";
		exit;
	}
	if( url ~ /^[a-zA-Z]+:\// )
	{	httperr(401,"No proxy");
		exit;
	}
	print strftime("%b %d %H:%M:%S %Y %a : ") $0 >>"/var/log/httpd.log";
	fflush("/var/log/httpd.log");
	uri=url;
	sub(/^\//,"",uri);
	head=1;
}

head && ($0=="" || $0=="\r" || $0=="\n") {
	head=0;
	query="";
	if( uri ~ /^~/ )
		dir= get_user_home(user_from_uri(uri)) "/" users_webdir "/";
	else	dir= document_root "/" ;
#print "user='" user_from_uri(uri) "' file='" file_from_uri(uri) "'";
	
	
	file= dir file_from_uri(uri);
	if( index(file,"?") )
	{	query=substr(file,index(file,"?")+1);
		gsub(/'/,"\"",query);
		file=substr(file,1,index(file,"?")-1);
	}
	gsub(/\.\.$/,"../",file);
	while( gsub(/\/[^/.]+\/\.\.\//,"/",file) );
#print "-----------------" file "-------------" dir "-----------";
	if( substr(file,1,length(dir)) != dir )
	{	httperr(404,"Error");
		exit;
	}
	gsub(/\/+$/,"",file);
	if( !system("test -d " file) )
	{	f=file;
		for(x in startfile)
		{	f=file "/" x;
			if( !system("test -e " f) )
				break;
		}
		file=f;
	}
	if( system("test -e " file) )
	{	httperr(404,"Not found");
		exit;
	}
	if( !system("test -x " file) )
	{	header();
		system("QUERY_STRING='" query "' " file);
	}
	else
	{	header();
		type=get_mimetype(file);
		printf("Content-Type: " type "\n\n");

		system("/bin/cat \"" file "\"");
#		while( (getline buf < file)>0 )
#			print buf;
	}
	exit;
}

