const axios = require("axios");
const FormData = require("form-data");
const kixieBatch = require("../models/kixieModel");

async function sendSms(kixieCredentials, kixieTemplate, tableData, batchId,  userId) {
	const smsPromises = tableData.map(async ({ Name, Phone }) => {
		const form = new FormData();
		const formData = {
			call: "sendsms",
			businessid: kixieCredentials.businessId,
			userid: kixieCredentials.kixieUserId,
			apiKey: kixieCredentials.apiKey,
		};

		Object.keys(formData).forEach((key) => {
			form.append(key, formData[key]);
		});

		const personalizedMessage = kixieTemplate.content.replace(/\$\{name\}/g, Name);
		form.append("number", `+1${Phone}`);
		form.append("message", personalizedMessage);

		try {
			const res = await axios.post("https://apig.kixie.com/itn/sendmms", form, { headers: { ...form.getHeaders() } });
			console.log(res)
			if(res.data.error){
				  throw new Error(res.data.error);  
			}else if(res.data.success){
				return { Name, Phone, status: "Success" };
			}else{
				throw new Error("Something went wrong try again");  
			}
			
		} catch (error) {
			console.error("SMS Error:", error);
			return { Name, Phone, status: "Failed", reason: error.message };
		}
	});

	const smsResults = await Promise.allSettled(smsPromises);

  const successfulSms = smsResults.filter(res => res.status === "fulfilled" && res.value && res.value.status === "Success");

  if (successfulSms.length > 0) {
    // Create a new record for the kixie batch
    const batch = new kixieBatch({
      _id: batchId, 
      userId: userId,
      kixieCredentialId: kixieCredentials._id,  
      kixieTemplateId: kixieTemplate._id,  
      smsCount: successfulSms.length
    });

    try {
      await batch.save();
      console.log('Batch record saved successfully');
    } catch (error) {
      console.error('Error saving batch record:', error);
    }
  }

  return smsResults;
}

module.exports = sendSms;
