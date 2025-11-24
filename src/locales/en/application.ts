export default {
  application: {
    title: "Application Management",
    list: "Application List",
    create: "Create Application",
    edit: "Edit Application",
    detail: "Application Details",
    delete: "Delete Application",
    deleteConfirm: "Are you sure you want to delete application {name}?",
    deleteSuccess: "Application deleted successfully",
    deleteFailed: "Failed to delete application",
    createSuccess: "Application created successfully",
    createFailed: "Failed to create application",
    updateSuccess: "Application updated successfully",
    updateFailed: "Failed to update application",

    // Form fields
    fields: {
      id: "ID",
      name: "Application Name",
      code: "Application Code",
      description: "Description",
      logo: "Logo",
      website: "Official Website",
      contactEmail: "Contact Email",
      currentVersion: "Current Version",
      owner: "Owner",
      team: "Development Team",
      status: "Status",
      isActive: "Is Active",
      tags: "Tags",
      metadata: "Metadata",
      createdAt: "Created At",
      updatedAt: "Updated At"
    },

    // Status
    status: {
      development: "Development",
      testing: "Testing",
      active: "Active",
      maintenance: "Maintenance",
      deprecated: "Deprecated",
      archived: "Archived"
    },

    // Statistics
    statistics: {
      title: "Statistics",
      licenses: "Licenses",
      licenseTotal: "Total Licenses",
      licenseActive: "Active Licenses",
      feedbacks: "Feedbacks",
      feedbackTotal: "Total Feedbacks",
      feedbackOpen: "Open Feedbacks",
      articles: "Articles",
      articleTotal: "Total Related Articles"
    },

    // Actions
    actions: {
      create: "Create Application",
      edit: "Edit",
      delete: "Delete",
      view: "View Details",
      refresh: "Refresh",
      search: "Search",
      reset: "Reset",
      uploadLogo: "Upload Logo",
      removeLogo: "Remove Logo"
    },

    // Search and filter
    search: {
      placeholder: "Search by name or code",
      statusFilter: "Filter by Status",
      allStatus: "All Status"
    },

    // Form tips
    formTips: {
      nameRequired: "Please enter application name",
      nameLength: "Application name cannot exceed 100 characters",
      codeRequired: "Please enter application code",
      codeLength: "Application code cannot exceed 50 characters",
      codeUnique: "Application code must be unique within tenant",
      emailFormat: "Please enter a valid email address",
      websiteFormat: "Please enter a valid website URL",
      versionFormat: "Version format: e.g. 1.0.0",
      logoFormat: "Only JPG and PNG images are supported",
      logoSize: "Image size cannot exceed {size}MB",
      uploadLogoSuccess: "Logo uploaded successfully",
      uploadLogoFailed: "Failed to upload logo"
    },

    // Related data
    relatedData: {
      articles: "Related Articles",
      noArticles: "No related articles"
    }
  }
};
