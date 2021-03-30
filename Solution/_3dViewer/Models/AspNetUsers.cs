using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;

namespace _3dViewer.Models
{
    public partial class AspNetUsers : IdentityUser { 
        public AspNetUsers()
        {
            Permissions = new HashSet<Permissions>();
        }

        public string Userkey { get; set; }
        public string Name { get; set; }
        public DateTime? Birthdate { get; set; }
        public string Livingaddress { get; set; }
        public string Regaddress { get; set; }
        public string Iin { get; set; }
        public string Docnumber { get; set; }
        public DateTime? Docissuedate { get; set; }
        public string Docissueauth { get; set; }
        public string Phone { get; set; }

        public virtual ICollection<Permissions> Permissions { get; set; }
    }
}
