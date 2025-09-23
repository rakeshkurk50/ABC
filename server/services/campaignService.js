const Brevo = require('@getbrevo/brevo');

const createCampaign = async (campaignData) => {
  try {
    const apiInstance = new Brevo.EmailCampaignsApi();
    apiInstance.setApiKey(Brevo.EmailCampaignsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const campaign = new Brevo.CreateEmailCampaign();
    campaign.name = campaignData.name;
    campaign.subject = campaignData.subject;
    campaign.sender = campaignData.sender;
    campaign.type = "classic";
    campaign.htmlContent = campaignData.htmlContent;
    campaign.recipients = campaignData.recipients;
    campaign.scheduledAt = campaignData.scheduledAt;

    const result = await apiInstance.createEmailCampaign(campaign);
    console.log('Campaign created successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating campaign:', error.message || error);
    return { success: false, error: error.message || 'Failed to create campaign' };
  }
};

module.exports = { createCampaign };