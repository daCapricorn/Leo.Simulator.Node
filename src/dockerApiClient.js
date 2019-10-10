var PROTO_PATH = __dirname + '/docker.proto';

var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var docker_proto = grpc.loadPackageDefinition(packageDefinition).docker_pb;//docker_pb is the package name in proto file

const getDockerInfo = ()=> {
  var client = new docker_proto.GetDocker('localhost:50051', //GetDocker is the service name in proto
    grpc.credentials.createInsecure());

  client.GetDockerInfo({path: ''}, (err, response)=> {  //GetDockerInfo is the rpc name in proto
    if(err){
      console.log("err:", err);
    }else{
      const infoJson = JSON.parse(response.info);
      //console.log('Get Docker Info:', infoJson);
      return infoJson;
    }
    
  });
}
const getDockerImages = ()=>{
  var client = new docker_proto.GetDocker('localhost:50051', //GetDocker is the service name in proto
    grpc.credentials.createInsecure());

  client.GetDockerImages({req: ''}, (err, response)=> {  //GetDockerInfo is the rpc name in proto
    if(err){
      console.log("err:", err);
    }else{
      //response.images.map(i=>console.log(i));
      return response.images;
    }
    
  });
}
exports.getDockerInfo =  getDockerInfo;
exports.getDockerImages = getDockerImages;

/****
 * 
 * 
 * async fn main() -> Result<(), Box<dyn std::error::Error>> {

	let channel = Channel::from_static("http://[::1]:50051")
		.intercept_headers(|headers| {
			headers.insert(
				"authorization",
				HeaderValue::from_static("Leo security agent with some-secret-token"),
			);
		})
		.channel();
	let mut client = GetDockerClient::new(channel);
	let request = tonic::Request::new(DockerInfoRequest {
		path: "".into(),
	});

	let response = client.get_docker_info(request).await?;

	println!("RESPONSE={}", response.into_inner().info);
	let request = tonic::Request::new(DockerImagesRequest {
		req: "images".into(),
	});
	let response = client.get_docker_images(request).await?;

	println!("RESPONSE={:#?}", response.into_inner().images);
	Ok(())
}

 */