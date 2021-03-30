using System;
using System.Collections.Generic;

namespace _3dViewer.Models
{
    public partial class RegistrationKeys
    {
        public int Id { get; set; }
        public string UserName { get; set; }
        public string UserType { get; set; }
        public string Note { get; set; }
        public string KeyValue { get; set; }
        public DateTime IssueDate { get; set; }
    }
}
